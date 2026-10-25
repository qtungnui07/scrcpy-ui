import { useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AdbDevice, CommandOutput } from "../types";
import { useDeviceStore } from "../stores/deviceStore";
import { useAppStore } from "../stores/appStore";

const DEVICE_POLL_INTERVAL_MS = 5000;

// Auto-reconnect tuning for wireless (Wi-Fi/TCP-IP) devices.
const RECONNECT_MAX_ATTEMPTS = 8;
const RECONNECT_RETRY_DELAY_MS = 15000;

interface ReconnectState {
  attempts: number;
  lastAttempt: number;
  /** Device is still listed by adb but in `offline` state; needs a disconnect+connect cycle. */
  offline: boolean;
}

interface UseAdbOptions {
  /** Keep polling in exactly one app-level owner; consumers only use the shared store. */
  poll?: boolean;
}

export function useAdb({ poll = false }: UseAdbOptions = {}) {
  const {
    devices,
    selectedSerial,
    savedDevices,
    isPollingActive,
    setDevices,
    setSelectedSerial,
    saveDevice,
    removeSavedDevice,
    updateDeviceAlias,
  } = useDeviceStore();

  const { addNotification, addLog, binaryStatus } = useAppStore();
  const isPollingRef = useRef(false);

  // Reconnect bookkeeping lives in refs because it is only meaningful to the
  // single polling owner and must survive re-renders without triggering them.
  const seenWirelessRef = useRef<Set<string>>(new Set());
  const pendingReconnectRef = useRef<Map<string, ReconnectState>>(new Map());
  const userDisconnectedRef = useRef<Set<string>>(new Set());
  const gaveUpRef = useRef<Set<string>>(new Set());

  const refreshDevices = useCallback(async () => {
    if (!binaryStatus?.adb_path) return null;

    try {
      const result = await invoke<AdbDevice[]>("get_adb_devices");
      setDevices(result);
      return result;
    } catch (err: any) {
      console.warn("Failed to query adb devices:", err);
      // null tells the poller the query itself failed; an empty array would
      // otherwise be indistinguishable from "every device dropped".
      return null;
    }
  }, [binaryStatus?.adb_path, setDevices]);

  /**
   * Runs on every poll sweep. Detects wireless devices that vanished or went
   * `offline` since the previous sweep and quietly re-issues `adb connect`
   * with a retry cap and backoff. Skips devices the user disconnected on
   * purpose and resets its bookkeeping as soon as a device is healthy again.
   */
  const runReconnectSweep = useCallback(
    async (current: AdbDevice[] | null) => {
      if (current === null) return;

      const { autoReconnectWireless } = useDeviceStore.getState();
      const seen = seenWirelessRef.current;
      const pending = pendingReconnectRef.current;
      const userDisconnected = userDisconnectedRef.current;
      const gaveUp = gaveUpRef.current;

      const wirelessNow = current.filter((d) => d.connection_type === "Wireless");
      const present = new Map(wirelessNow.map((d) => [d.serial, d]));

      // Healthy again → clear all bookkeeping for that serial.
      for (const [serial, state] of [...pending.entries()]) {
        const dev = present.get(serial);
        if (dev && dev.state === "device") {
          pending.delete(serial);
          gaveUp.delete(serial);
          userDisconnected.delete(serial);
          addLog({
            session_id: "adb",
            serial,
            level: "info",
            message: state.attempts > 0
              ? `Wireless device ${serial} is back online after ${state.attempts} reconnect attempt(s).`
              : `Wireless device ${serial} is online.`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      if (!autoReconnectWireless) {
        pending.clear();
        seen.clear();
        for (const serial of wirelessNow.map((d) => d.serial)) seen.add(serial);
        return;
      }

      // Mark wireless devices that disappeared since the last sweep.
      for (const serial of seen) {
        if (!present.has(serial) && !userDisconnected.has(serial) && !pending.has(serial)) {
          pending.set(serial, { attempts: 0, lastAttempt: 0, offline: false });
          addLog({
            session_id: "adb",
            serial,
            level: "info",
            message: `Lost wireless device ${serial} — auto-reconnect engaged.`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // A wireless device stuck in `offline` state also needs a reconnect cycle.
      for (const dev of wirelessNow) {
        if (dev.state === "offline" && !userDisconnected.has(dev.serial) && !pending.has(dev.serial)) {
          pending.set(dev.serial, { attempts: 0, lastAttempt: 0, offline: true });
          addLog({
            session_id: "adb",
            serial: dev.serial,
            level: "info",
            message: `Wireless device ${dev.serial} is offline — auto-reconnect engaged.`,
            timestamp: new Date().toISOString(),
          });
        } else if (dev.state === "offline") {
          const state = pending.get(dev.serial);
          if (state) state.offline = true;
        }
      }

      seen.clear();
      for (const serial of present.keys()) seen.add(serial);

      const adbPath = useAppStore.getState().binaryStatus?.adb_path;
      if (!adbPath || pending.size === 0) return;

      for (const [serial, state] of pending) {
        if (state.attempts >= RECONNECT_MAX_ATTEMPTS) {
          pending.delete(serial);
          if (!gaveUp.has(serial)) {
            gaveUp.add(serial);
            addNotification({
              type: "warning",
              title: "Auto-Reconnect Gave Up",
              message: `Could not reach ${serial} after ${RECONNECT_MAX_ATTEMPTS} attempts. Reconnect manually from saved devices.`,
            });
            addLog({
              session_id: "adb",
              serial,
              level: "error",
              message: `Auto-reconnect failed for ${serial} after ${RECONNECT_MAX_ATTEMPTS} attempts.`,
              timestamp: new Date().toISOString(),
            });
          }
          continue;
        }

        const elapsed = Date.now() - state.lastAttempt;
        if (state.lastAttempt !== 0 && elapsed < RECONNECT_RETRY_DELAY_MS) continue;

        state.attempts += 1;
        state.lastAttempt = Date.now();

        const [ip, portStr] = serial.split(":");
        const port = Number.parseInt(portStr, 10) || 5555;

        try {
          if (state.offline) {
            // Stale adb entry: drop it first or `connect` may report "already connected".
            await invoke<CommandOutput>("disconnect_wireless_device", { target: serial });
          }
          const res = await invoke<CommandOutput>("connect_wireless_device", { ip, port });
          if (res.success) {
            pending.delete(serial);
            addNotification({
              type: "success",
              title: "Device Reconnected",
              message: `Wireless device ${serial} is back online (attempt ${state.attempts}).`,
            });
            addLog({
              session_id: "adb",
              serial,
              level: "info",
              message: `Auto-reconnect succeeded: ${res.stdout || `connected to ${serial}`}`,
              timestamp: new Date().toISOString(),
            });
            await refreshDevices();
          } else {
            addLog({
              session_id: "adb",
              serial,
              level: "info",
              message: `Reconnect attempt ${state.attempts}/${RECONNECT_MAX_ATTEMPTS} failed: ${res.stdout || res.stderr || "no response"}`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (err: any) {
          addLog({
            session_id: "adb",
            serial,
            level: "error",
            message: `Reconnect attempt ${state.attempts}/${RECONNECT_MAX_ATTEMPTS} error: ${String(err)}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    },
    [addNotification, addLog, refreshDevices]
  );

  // Device discovery must have a single owner. Several screens (and the always-mounted
  // wireless dialog) use this hook, so polling from every hook instance floods ADB while
  // a wireless scrcpy session is active.
  useEffect(() => {
    if (!poll || !isPollingActive || !binaryStatus?.adb_path) return;

    const interval = setInterval(async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const result = await refreshDevices();
        await runReconnectSweep(result);
      } finally {
        isPollingRef.current = false;
      }
    }, DEVICE_POLL_INTERVAL_MS);

    // Initial immediate fetch
    refreshDevices().then((result) => runReconnectSweep(result));

    return () => clearInterval(interval);
  }, [poll, isPollingActive, binaryStatus?.adb_path, refreshDevices, runReconnectSweep]);

  const pairDevice = useCallback(
    async (ip: string, port: number, code: string) => {
      try {
        addLog({
          session_id: "adb",
          serial: `${ip}:${port}`,
          level: "info",
          message: `Attempting to pair with ${ip}:${port}...`,
          timestamp: new Date().toISOString(),
        });

        const res = await invoke<CommandOutput>("pair_wireless_device", {
          ip,
          port,
          code,
        });

        if (res.success) {
          addNotification({
            type: "success",
            title: "Pairing Successful",
            message: `Successfully paired with ${ip}:${port}`,
          });
          addLog({
            session_id: "adb",
            serial: `${ip}:${port}`,
            level: "info",
            message: res.stdout || "Device paired successfully!",
            timestamp: new Date().toISOString(),
          });
          return true;
        } else {
          addNotification({
            type: "error",
            title: "Pairing Failed",
            message: res.stderr || res.stdout || "Pairing code rejected or connection timeout.",
          });
          addLog({
            session_id: "adb",
            serial: `${ip}:${port}`,
            level: "error",
            message: `Pair failed: ${res.stderr || res.stdout}`,
            timestamp: new Date().toISOString(),
          });
          return false;
        }
      } catch (err: any) {
        addNotification({
          type: "error",
          title: "Pairing Error",
          message: String(err),
        });
        return false;
      }
    },
    [addNotification, addLog]
  );

  const connectDevice = useCallback(
    async (ip: string, port: number = 5555, alias?: string) => {
      // Manual connect clears any "user disconnected on purpose" marker so the
      // auto-reconnect sweep resumes watching this serial.
      userDisconnectedRef.current.delete(`${ip}:${port}`);
      gaveUpRef.current.delete(`${ip}:${port}`);
      try {
        addLog({
          session_id: "adb",
          serial: `${ip}:${port}`,
          level: "info",
          message: `Connecting to ${ip}:${port}...`,
          timestamp: new Date().toISOString(),
        });

        const res = await invoke<CommandOutput>("connect_wireless_device", {
          ip,
          port,
        });

        if (res.success) {
          addNotification({
            type: "success",
            title: "Connected",
            message: `Connected to ${ip}:${port}`,
          });

          // Save to device history
          saveDevice({
            ip,
            port,
            alias: alias || `Device ${ip.split(".").pop()}`,
          });

          await refreshDevices();
          setSelectedSerial(`${ip}:${port}`);
          return true;
        } else {
          addNotification({
            type: "error",
            title: "Connection Failed",
            message: res.stderr || res.stdout || "Could not connect to wireless device.",
          });
          addLog({
            session_id: "adb",
            serial: `${ip}:${port}`,
            level: "error",
            message: `Connect failed: ${res.stderr || res.stdout}`,
            timestamp: new Date().toISOString(),
          });
          return false;
        }
      } catch (err: any) {
        addNotification({
          type: "error",
          title: "Connection Error",
          message: String(err),
        });
        return false;
      }
    },
    [addNotification, addLog, saveDevice, refreshDevices, setSelectedSerial]
  );

  const disconnectDevice = useCallback(
    async (target: string) => {
      // Remember the intent so the reconnect sweep does not undo it.
      userDisconnectedRef.current.add(target);
      pendingReconnectRef.current.delete(target);
      try {
        const res = await invoke<CommandOutput>("disconnect_wireless_device", { target });
        addNotification({
          type: res.success ? "info" : "error",
          title: res.success ? "Disconnected" : "Disconnect Failed",
          message: res.stdout || res.stderr || `Disconnected ${target}`,
        });
        await refreshDevices();
        return res.success;
      } catch (err: any) {
        addNotification({
          type: "error",
          title: "Disconnect Error",
          message: String(err),
        });
        return false;
      }
    },
    [addNotification, refreshDevices]
  );

  const enableTcpip = useCallback(
    async (serial: string, port: number = 5555) => {
      try {
        const res = await invoke<CommandOutput>("enable_tcpip", {
          serial,
          port,
        });

        if (res.success) {
          addNotification({
            type: "success",
            title: "TCP/IP Mode Enabled",
            message: `Port ${port} opened on device ${serial}. You can now unplug USB and connect wirelessly!`,
          });
          return true;
        } else {
          addNotification({
            type: "error",
            title: "TCP/IP Switch Failed",
            message: res.stderr || res.stdout || "Failed to switch to TCP/IP.",
          });
          return false;
        }
      } catch (err: any) {
        addNotification({
          type: "error",
          title: "TCP/IP Error",
          message: String(err),
        });
        return false;
      }
    },
    [addNotification]
  );

  const getDeviceWifiIp = useCallback(async (serial: string) => {
    try {
      const ip = await invoke<string>("get_device_wifi_ip", { serial });
      return ip;
    } catch (err: any) {
      return null;
    }
  }, []);

  const rebootDevice = useCallback(
    async (serial: string, target?: string) => {
      try {
        const res = await invoke<CommandOutput>("reboot_device", {
          serial,
          target: target || null,
        });
        addNotification({
          type: res.success ? "info" : "error",
          title: res.success ? "Rebooting Device" : "Reboot Failed",
          message: res.stdout || res.stderr || `Reboot command sent to ${serial}`,
        });
        return res.success;
      } catch (err: any) {
        addNotification({
          type: "error",
          title: "Reboot Error",
          message: String(err),
        });
        return false;
      }
    },
    [addNotification]
  );

  const runAdbRaw = useCallback(async (args: string[]) => {
    try {
      const res = await invoke<CommandOutput>("run_adb_raw", { args });
      return res;
    } catch (err: any) {
      return {
        success: false,
        stdout: "",
        stderr: String(err),
      };
    }
  }, []);

  const selectedDevice = devices.find((d) => d.serial === selectedSerial) || null;

  return {
    devices,
    selectedDevice,
    selectedSerial,
    savedDevices,
    refreshDevices,
    pairDevice,
    connectDevice,
    disconnectDevice,
    enableTcpip,
    getDeviceWifiIp,
    rebootDevice,
    runAdbRaw,
    saveDevice,
    removeSavedDevice,
    updateDeviceAlias,
  };
}

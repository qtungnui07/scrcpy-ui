import { useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AdbDevice, CommandOutput } from "../types";
import { useDeviceStore } from "../stores/deviceStore";
import { useAppStore } from "../stores/appStore";

const DEVICE_POLL_INTERVAL_MS = 5000;

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

  const refreshDevices = useCallback(async () => {
    if (!binaryStatus?.adb_path) return [];

    try {
      const result = await invoke<AdbDevice[]>("get_adb_devices");
      setDevices(result);
      return result;
    } catch (err: any) {
      console.warn("Failed to query adb devices:", err);
      return [];
    }
  }, [binaryStatus?.adb_path, setDevices]);

  // Device discovery must have a single owner. Several screens (and the always-mounted
  // wireless dialog) use this hook, so polling from every hook instance floods ADB while
  // a wireless scrcpy session is active.
  useEffect(() => {
    if (!poll || !isPollingActive || !binaryStatus?.adb_path) return;

    const interval = setInterval(async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        await refreshDevices();
      } finally {
        isPollingRef.current = false;
      }
    }, DEVICE_POLL_INTERVAL_MS);

    // Initial immediate fetch
    refreshDevices();

    return () => clearInterval(interval);
  }, [poll, isPollingActive, binaryStatus?.adb_path, refreshDevices]);

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

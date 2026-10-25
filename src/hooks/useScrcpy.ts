import { useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { AdbDevice, ScrcpySession, LogEntry, ActionResult } from "../types";
import { useAppStore } from "../stores/appStore";
import { useConfigStore } from "../stores/configStore";
import { useDeviceStore } from "../stores/deviceStore";

const RELAUNCH_MAX_ATTEMPTS = 5;
const RELAUNCH_BASE_DELAY_MS = 5000;
/** Sessions that die younger than this never established a working stream;
 * relaunching would just replay a launch failure (bad args, unauthorized, ...). */
const RELAUNCH_MIN_RUNTIME_MS = 10000;

// Session ids stopped through the app (Stop button / Stop All). Module-level so
// every useScrcpy()/useSessionEvents() instance shares the same bookkeeping —
// the stop may run in one component while the status event lands in another.
const userStoppedSessions = new Set<string>();

/** Launches a scrcpy session without any hook/closure state, so it is safe to
 * call from timers and event listeners. Mirrors launchSession() behavior. */
async function launchSessionDirect(
  serial: string,
  customArgs: string[]
): Promise<ScrcpySession | null> {
  const store = useAppStore.getState();
  const sessionId = `session-${serial.replace(/[:.]/g, "-")}-${Date.now()}`;

  store.addLog({
    session_id: sessionId,
    serial,
    level: "info",
    message: `Launching scrcpy: scrcpy -s ${serial} ${customArgs.join(" ")}`,
    timestamp: new Date().toISOString(),
  });

  try {
    const session = await invoke<ScrcpySession>("launch_scrcpy_session", {
      sessionId,
      serial,
      customArgs,
    });

    store.addSession(session);
    store.addNotification({
      type: "success",
      title: "Mirroring Started",
      message: `Scrcpy session launched for ${serial}`,
    });
    return session;
  } catch (err: any) {
    store.addNotification({
      type: "error",
      title: "Launch Failed",
      message: String(err),
    });
    store.addLog({
      session_id: sessionId,
      serial,
      level: "error",
      message: `Launch error: ${err}`,
      timestamp: new Date().toISOString(),
    });
    return null;
  }
}

/**
 * Restores a mirroring session that died unexpectedly (device/network drop).
 * Waits for the device to report `device` state again before relaunching with
 * the exact same scrcpy args, with a capped number of attempts so a device
 * that never comes back does not retry forever.
 */
function scheduleSessionRelaunch(serial: string, customArgs: string[], attempt: number) {
  window.setTimeout(async () => {
    const store = useAppStore.getState();
    store.addLog({
      session_id: "adb",
      serial,
      level: "info",
      message: `Attempting to restore mirroring session (attempt ${attempt}/${RELAUNCH_MAX_ATTEMPTS})...`,
      timestamp: new Date().toISOString(),
    });

    try {
      const devs = await invoke<AdbDevice[]>("get_adb_devices");
      // Sync the shared store so the rest of the UI sees fresh device state.
      useDeviceStore.getState().setDevices(devs);

      const dev = devs.find((d) => d.serial === serial);
      if (dev && dev.state === "device") {
        const session = await launchSessionDirect(serial, customArgs);
        if (session) {
          store.addLog({
            session_id: session.id,
            serial,
            level: "info",
            message: `Mirroring session restored for ${serial} after unexpected disconnect.`,
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      if (attempt < RELAUNCH_MAX_ATTEMPTS) {
        scheduleSessionRelaunch(serial, customArgs, attempt + 1);
      } else {
        store.addNotification({
          type: "warning",
          title: "Session Restore Failed",
          message:
            dev && dev.state !== "device"
              ? `Device ${serial} did not come back online. Reconnect it and start mirroring manually.`
              : `Could not restore the mirroring session for ${serial}.`,
        });
      }
    } catch (err: any) {
      if (attempt < RELAUNCH_MAX_ATTEMPTS) {
        scheduleSessionRelaunch(serial, customArgs, attempt + 1);
      } else {
        store.addNotification({
          type: "warning",
          title: "Session Restore Failed",
          message: `Could not restore the session for ${serial}: ${String(err)}`,
        });
      }
    }
  }, RELAUNCH_BASE_DELAY_MS * attempt);
}

export function useScrcpy() {
  const { activeSessions, setActiveSessions, addSession, removeSession, addLog, addNotification } =
    useAppStore();

  const { buildCliArgs } = useConfigStore();
  const { selectedSerial, devices } = useDeviceStore();

  const launchSession = useCallback(
    async (targetSerial?: string, overrideArgs?: string[]) => {
      const serial = targetSerial || selectedSerial;
      if (!serial) {
        addNotification({
          type: "warning",
          title: "No Device Selected",
          message: "Please select or connect an Android device first.",
        });
        return null;
      }

      const dev = devices.find((d) => d.serial === serial);
      if (dev && dev.state !== "device") {
        addNotification({
          type: "error",
          title: "Device Not Ready",
          message: `Device is in state '${dev.state}'. Please authorize USB debugging on your device.`,
        });
        return null;
      }

      const customArgs = overrideArgs || buildCliArgs();
      return launchSessionDirect(serial, customArgs);
    },
    [selectedSerial, devices, buildCliArgs, addNotification, addSession, addLog]
  );

  const stopSession = useCallback(
    async (sessionId: string) => {
      userStoppedSessions.add(sessionId);
      try {
        const success = await invoke<boolean>("stop_scrcpy_session", { sessionId });
        if (success) {
          removeSession(sessionId);
          addNotification({
            type: "info",
            title: "Session Stopped",
            message: `Stopped scrcpy session`,
          });
        } else {
          userStoppedSessions.delete(sessionId);
        }
        return success;
      } catch (err: any) {
        userStoppedSessions.delete(sessionId);
        addNotification({
          type: "error",
          title: "Stop Session Failed",
          message: String(err),
        });
        return false;
      }
    },
    [removeSession, addNotification]
  );

  const stopAllSessions = useCallback(async () => {
    try {
      for (const s of useAppStore.getState().activeSessions) {
        userStoppedSessions.add(s.id);
      }
      const count = await invoke<number>("stop_all_sessions");
      setActiveSessions([]);
      addNotification({
        type: "info",
        title: "All Sessions Stopped",
        message: `Closed ${count} active scrcpy session(s)`,
      });
      return count;
    } catch (err: any) {
      addNotification({
        type: "error",
        title: "Error Stopping Sessions",
        message: String(err),
      });
      return 0;
    }
  }, [setActiveSessions, addNotification]);

  // Quick Action triggers
  const sendKey = useCallback(
    async (serial: string, keycode: number, keyName?: string) => {
      try {
        const res = await invoke<ActionResult>("send_keyevent", { serial, keycode });
        if (res.success) {
          addLog({
            session_id: "action",
            serial,
            level: "info",
            message: `Keyevent triggered: ${keyName || keycode}`,
            timestamp: new Date().toISOString(),
          });
        } else {
          addNotification({
            type: "error",
            title: "Keyevent Failed",
            message: res.message,
          });
        }
        return res.success;
      } catch (e: any) {
        addNotification({ type: "error", title: "Action Failed", message: String(e) });
        return false;
      }
    },
    [addNotification, addLog]
  );

  const sendText = useCallback(
    async (serial: string, text: string) => {
      try {
        const res = await invoke<ActionResult>("send_text_input", { serial, text });
        if (res.success) {
          addNotification({ type: "success", title: "Text Sent", message: `Sent text to ${serial}` });
        } else {
          addNotification({ type: "error", title: "Failed to send text", message: res.message });
        }
        return res.success;
      } catch (e: any) {
        addNotification({ type: "error", title: "Action Failed", message: String(e) });
        return false;
      }
    },
    [addNotification]
  );

  const takeScreenshot = useCallback(
    async (serial: string, savePath?: string) => {
      try {
        addNotification({
          type: "info",
          title: "Capturing Screenshot",
          message: "Taking screenshot from device...",
        });
        const res = await invoke<ActionResult>("take_screenshot", { serial, savePath: savePath || null });
        if (res.success) {
          addNotification({
            type: "success",
            title: "Screenshot Captured",
            message: res.message,
          });
          addLog({
            session_id: "action",
            serial,
            level: "info",
            message: `Screenshot saved: ${res.data}`,
            timestamp: new Date().toISOString(),
          });
        } else {
          addNotification({
            type: "error",
            title: "Screenshot Failed",
            message: res.message,
          });
        }
        return res;
      } catch (e: any) {
        addNotification({ type: "error", title: "Screenshot Error", message: String(e) });
        return null;
      }
    },
    [addNotification, addLog]
  );

  const installApk = useCallback(
    async (serial: string, apkPath: string) => {
      try {
        addNotification({
          type: "info",
          title: "Installing APK",
          message: `Installing ${apkPath.split(/[/\\]/).pop()}...`,
        });
        addLog({
          session_id: "action",
          serial,
          level: "info",
          message: `Installing APK: ${apkPath}`,
          timestamp: new Date().toISOString(),
        });
        const res = await invoke<ActionResult>("install_apk", { serial, apkPath });
        if (res.success) {
          addNotification({
            type: "success",
            title: "APK Installed",
            message: "App installed successfully!",
          });
          addLog({
            session_id: "action",
            serial,
            level: "info",
            message: `APK Installation Success: ${apkPath}`,
            timestamp: new Date().toISOString(),
          });
        } else {
          addNotification({
            type: "error",
            title: "Installation Failed",
            message: res.message,
          });
          addLog({
            session_id: "action",
            serial,
            level: "error",
            message: `APK Installation Failure: ${res.message}`,
            timestamp: new Date().toISOString(),
          });
        }
        return res.success;
      } catch (e: any) {
        addNotification({ type: "error", title: "APK Install Error", message: String(e) });
        return false;
      }
    },
    [addNotification, addLog]
  );

  const pushFile = useCallback(
    async (serial: string, localPath: string, remotePath?: string) => {
      try {
        addNotification({
          type: "info",
          title: "Pushing File",
          message: `Pushing ${localPath.split(/[/\\]/).pop()} to device...`,
        });
        const res = await invoke<ActionResult>("push_file", {
          serial,
          localPath,
          remotePath: remotePath || null,
        });
        if (res.success) {
          addNotification({
            type: "success",
            title: "File Pushed",
            message: res.message,
          });
          addLog({
            session_id: "action",
            serial,
            level: "info",
            message: res.message,
            timestamp: new Date().toISOString(),
          });
        } else {
          addNotification({
            type: "error",
            title: "Push Failed",
            message: res.message,
          });
        }
        return res.success;
      } catch (e: any) {
        addNotification({ type: "error", title: "File Push Error", message: String(e) });
        return false;
      }
    },
    [addNotification, addLog]
  );

  return {
    activeSessions,
    launchSession,
    stopSession,
    stopAllSessions,
    sendKey,
    sendText,
    takeScreenshot,
    installApk,
    pushFile,
  };
}

/**
 * App-level event wiring. Mount ONCE (App.tsx) — every instance would duplicate
 * log entries, notifications, and auto-relaunches because Tauri events fan out
 * to all registered listeners.
 */
export function useSessionEvents() {
  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const list = await invoke<ScrcpySession[]>("get_active_sessions");
        useAppStore.getState().setActiveSessions(list);
      } catch (e) {
        console.warn("Failed to get active sessions:", e);
      }
    };

    fetchActiveSessions();

    const unlistenLogPromise = listen<Omit<LogEntry, "id">>("scrcpy-log", (event) => {
      useAppStore.getState().addLog(event.payload);
    });

    const unlistenStatusPromise = listen<{
      session_id: string;
      serial: string;
      status: string;
      exit_code?: number;
      message?: string;
    }>("session-status-changed", (event) => {
      const { session_id, serial, status, exit_code, message } = event.payload;
      const store = useAppStore.getState();
      if (status === "stopped" || status === "error") {
        const wasUserStopped = userStoppedSessions.has(session_id);
        userStoppedSessions.delete(session_id);

        // Look up the dead session before removing it: its stored args are
        // what the relaunch replays, even if the user has since changed config.
        const original = store.activeSessions.find((s) => s.id === session_id);
        store.removeSession(session_id);

        const ranLongEnough =
          !!original && Date.now() - new Date(original.start_time).getTime() > RELAUNCH_MIN_RUNTIME_MS;
        const crashedAbruptly = exit_code === undefined || exit_code === null || exit_code !== 0;
        const shouldRelaunch =
          !wasUserStopped && crashedAbruptly && ranLongEnough && store.autoRelaunchSession;

        if (shouldRelaunch && original) {
          store.addNotification({
            type: "info",
            title: "Connection Lost",
            message: `Mirroring for ${serial} dropped — trying to restore the session automatically.`,
          });
          store.addLog({
            session_id: session_id,
            serial,
            level: "info",
            message: `Session ended unexpectedly (exit code ${exit_code ?? "unknown"}). Scheduling auto-restore.`,
            timestamp: new Date().toISOString(),
          });
          scheduleSessionRelaunch(serial, original.args.slice(2), 1);
        } else {
          store.addNotification({
            type: status === "error" ? "error" : "info",
            title: `Session ${status === "error" ? "Error" : "Finished"}`,
            message: message || `Session for ${serial} ended.`,
          });
        }
      }
    });

    return () => {
      unlistenLogPromise.then((u) => u());
      unlistenStatusPromise.then((u) => u());
    };
  }, []);
}

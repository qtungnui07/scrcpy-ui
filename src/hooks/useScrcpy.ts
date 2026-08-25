import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ScrcpySession, LogEntry, ActionResult } from "../types";
import { useAppStore } from "../stores/appStore";
import { useConfigStore } from "../stores/configStore";
import { useDeviceStore } from "../stores/deviceStore";

export function useScrcpy() {
  const {
    activeSessions,
    setActiveSessions,
    addSession,
    removeSession,
    addLog,
    addNotification,
  } = useAppStore();

  const { buildCliArgs } = useConfigStore();
  const { selectedSerial, devices } = useDeviceStore();

  const fetchActiveSessions = useCallback(async () => {
    try {
      const list = await invoke<ScrcpySession[]>("get_active_sessions");
      setActiveSessions(list);
      return list;
    } catch (e) {
      console.warn("Failed to get active sessions:", e);
      return [];
    }
  }, [setActiveSessions]);

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
      const sessionId = `session-${serial.replace(/[:.]/g, "-")}-${Date.now()}`;

      addLog({
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

        addSession(session);
        addNotification({
          type: "success",
          title: "Mirroring Started",
          message: `Scrcpy session launched for ${serial}`,
        });
        return session;
      } catch (err: any) {
        addNotification({
          type: "error",
          title: "Launch Failed",
          message: String(err),
        });
        addLog({
          session_id: sessionId,
          serial,
          level: "error",
          message: `Launch error: ${err}`,
          timestamp: new Date().toISOString(),
        });
        return null;
      }
    },
    [selectedSerial, devices, buildCliArgs, addNotification, addSession, addLog]
  );

  const stopSession = useCallback(
    async (sessionId: string) => {
      try {
        const success = await invoke<boolean>("stop_scrcpy_session", { sessionId });
        if (success) {
          removeSession(sessionId);
          addNotification({
            type: "info",
            title: "Session Stopped",
            message: `Stopped scrcpy session`,
          });
        }
        return success;
      } catch (err: any) {
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

  // Setup Event Listeners
  useEffect(() => {
    fetchActiveSessions();

    const unlistenLogPromise = listen<Omit<LogEntry, "id">>("scrcpy-log", (event) => {
      addLog(event.payload);
    });

    const unlistenStatusPromise = listen<{
      session_id: string;
      serial: string;
      status: string;
      exit_code?: number;
      message?: string;
    }>("session-status-changed", (event) => {
      const { session_id, serial, status, message } = event.payload;
      if (status === "stopped" || status === "error") {
        removeSession(session_id);
        addNotification({
          type: status === "error" ? "error" : "info",
          title: `Session ${status === "error" ? "Error" : "Finished"}`,
          message: message || `Session for ${serial} ended.`,
        });
      }
    });

    return () => {
      unlistenLogPromise.then((u) => u());
      unlistenStatusPromise.then((u) => u());
    };
  }, [fetchActiveSessions, addLog, removeSession, addNotification]);

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

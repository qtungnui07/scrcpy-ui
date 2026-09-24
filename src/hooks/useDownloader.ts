import { useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { BinaryStatus, ReleaseInfo, DownloadProgressPayload, UpdateCheckResult } from "../types";
import { useAppStore } from "../stores/appStore";

export function useDownloader() {
  const {
    binaryStatus,
    releaseInfo,
    downloadProgress,
    isDownloading,
    setBinaryStatus,
    setReleaseInfo,
    setDownloadProgress,
    setIsDownloading,
    addNotification,
    addLog,
  } = useAppStore();

  const fetchStatus = useCallback(async () => {
    try {
      const status = await invoke<BinaryStatus>("get_binary_status");
      setBinaryStatus(status);
      return status;
    } catch (err: any) {
      console.error("Failed to get binary status:", err);
      return null;
    }
  }, [setBinaryStatus]);

  const checkLatest = useCallback(async () => {
    try {
      const release = await invoke<ReleaseInfo>("check_latest_release");
      setReleaseInfo(release);
      return release;
    } catch (err: any) {
      addNotification({
        type: "error",
        title: "Update Check Failed",
        message: String(err),
      });
      return null;
    }
  }, [setReleaseInfo, addNotification]);

  const downloadEngine = useCallback(
    async (url?: string) => {
      setIsDownloading(true);
      setDownloadProgress({
        stage: "fetching",
        progress: 0,
        downloaded_bytes: 0,
        total_bytes: 0,
        message: "Initiating download...",
      });

      addLog({
        session_id: "system",
        serial: "system",
        level: "info",
        message: "Starting scrcpy / ADB engine download & extraction...",
        timestamp: new Date().toISOString(),
      });

      try {
        const updatedStatus = await invoke<BinaryStatus>("download_and_extract_engine", {
          downloadUrl: url || null,
        });
        setBinaryStatus(updatedStatus);
        setIsDownloading(false);
        setDownloadProgress(null);
        addNotification({
          type: "success",
          title: "Download Complete",
          message: "scrcpy & adb engine downloaded and verified successfully!",
        });
        addLog({
          session_id: "system",
          serial: "system",
          level: "info",
          message: `Engine installed at: ${updatedStatus.bin_dir}`,
          timestamp: new Date().toISOString(),
        });
        return updatedStatus;
      } catch (err: any) {
        setIsDownloading(false);
        setDownloadProgress(null);
        addNotification({
          type: "error",
          title: "Download Failed",
          message: String(err),
        });
        addLog({
          session_id: "system",
          serial: "system",
          level: "error",
          message: `Engine download error: ${err}`,
          timestamp: new Date().toISOString(),
        });
        throw err;
      }
    },
    [setIsDownloading, setDownloadProgress, setBinaryStatus, addNotification, addLog]
  );

  const checkAndAutoUpdate = useCallback(async () => {
    try {
      setIsDownloading(true);
      addLog({
        session_id: "system",
        serial: "system",
        level: "info",
        message: "Checking for scrcpy engine updates...",
        timestamp: new Date().toISOString(),
      });

      const result = await invoke<UpdateCheckResult>("check_and_auto_update");

      addLog({
        session_id: "system",
        serial: "system",
        level: "info",
        message: result.message,
        timestamp: new Date().toISOString(),
      });

      if (!result.needs_update) {
        if (result.latest_tag && result.installed_tag !== result.latest_tag) {
          addNotification({
            type: "success",
            title: "Engine Updated",
            message: `scrcpy updated to ${result.latest_tag}`,
          });
        }
      } else {
        addNotification({
          type: "warning",
          title: "Update Available",
          message: result.message,
        });
      }

      // Refresh binary status after check
      await fetchStatus();
    } catch (err: any) {
      addLog({
        session_id: "system",
        serial: "system",
        level: "error",
        message: `Auto-update check failed: ${err}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  }, [setIsDownloading, setDownloadProgress, addNotification, addLog, fetchStatus]);

  const hasCheckedRef = useRef(false);

  useEffect(() => {
    fetchStatus();

    // Auto-check for updates on first mount
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      checkAndAutoUpdate();
    }

    // Listen to download progress event from Rust
    const unlistenPromise = listen<DownloadProgressPayload>("download-progress", (event) => {
      setDownloadProgress(event.payload);
      if (event.payload.stage === "finished" || event.payload.stage === "error") {
        setIsDownloading(false);
      }
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [fetchStatus, checkAndAutoUpdate, setDownloadProgress, setIsDownloading]);

  return {
    binaryStatus,
    releaseInfo,
    downloadProgress,
    isDownloading,
    fetchStatus,
    checkLatest,
    downloadEngine,
    checkAndAutoUpdate,
  };
}

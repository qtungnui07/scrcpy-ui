import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { BinaryStatus, ReleaseInfo, DownloadProgressPayload } from "../types";
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

  useEffect(() => {
    fetchStatus();

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
  }, [fetchStatus, setDownloadProgress, setIsDownloading]);

  return {
    binaryStatus,
    releaseInfo,
    downloadProgress,
    isDownloading,
    fetchStatus,
    checkLatest,
    downloadEngine,
  };
}

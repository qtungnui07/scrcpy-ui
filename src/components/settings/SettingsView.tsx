import React, { useState } from "react";
import { useDownloader } from "../../hooks/useDownloader";
import { useConfigStore } from "../../stores/configStore";
import { useAppStore } from "../../stores/appStore";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import {
  Folder,
  Cpu,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const SettingsView: React.FC = () => {
  const {
    binaryStatus,
    downloadProgress,
    isDownloading,
    checkLatest,
    downloadEngine,
  } = useDownloader();

  const { resetToDefaults, config, updateConfig } = useConfigStore();
  const { addNotification } = useAppStore();

  const [activeSection, setActiveSection] = useState<"paths" | "engine" | "advanced">("engine");
  const [customAdbPath, setCustomAdbPath] = useState(binaryStatus?.adb_path || "");
  const [customRecordDir, setCustomRecordDir] = useState(config.recordPath || "");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleBrowseAdb = async () => {
    try {
      const selected = await openDialog({
        multiple: false,
        filters: [{ name: "ADB Executable", extensions: ["exe", ""] }],
      });
      if (selected && typeof selected === "string") {
        setCustomAdbPath(selected);
        addNotification({
          type: "success",
          title: "ADB Path Updated",
          message: `Selected: ${selected}`,
        });
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleBrowseRecordDir = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        setCustomRecordDir(selected);
        updateConfig({ recordPath: selected });
        addNotification({
          type: "success",
          title: "Save Directory Set",
          message: `Saved to: ${selected}`,
        });
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    const rel = await checkLatest();
    setIsCheckingUpdate(false);
    if (rel) {
      addNotification({
        type: "info",
        title: "Latest Release Found",
        message: `${rel.name} (${rel.tag_name})`,
      });
    }
  };

  const isReady = binaryStatus?.is_ready ?? false;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-[#1A1C1B]">
          Global Settings
        </h1>
        <p className="text-sm font-semibold text-[#4E4633]">
          Configure Scrcpy preferences, engine binaries, recording save locations, and system parameters.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full">
        {/* Left Sub-navigation */}
        <div className="xl:col-span-3 flex flex-col gap-3">
          <div className="sticky top-6 flex flex-col gap-2.5">
            {[
              { id: "engine", label: "Engine & Binaries", icon: <Cpu className="w-4 h-4" /> },
              { id: "paths", label: "Directory Paths", icon: <Folder className="w-4 h-4" /> },
              { id: "advanced", label: "Danger Zone", icon: <AlertTriangle className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={cn(
                  "flex items-center justify-between p-3.5 border-[3px] border-black font-extrabold text-xs uppercase rounded-xl transition-all cursor-pointer",
                  activeSection === tab.id
                    ? "bg-[#FFD027] text-black shadow-[4px_4px_0px_#000000] translate-x-[2px] translate-y-[2px]"
                    : "bg-white text-[#1A1C1B] hover:bg-[#EEEEEC] shadow-[2px_2px_0px_#000000]"
                )}
              >
                <span>{tab.label}</span>
                {tab.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Right Settings Content */}
        <div className="xl:col-span-9 flex flex-col gap-8">
          {/* Section 1: Engine Manager */}
          {activeSection === "engine" && (
            <section className="flex flex-col gap-4">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#FFD027] border-[3px] border-black rounded-full z-0 flex items-center justify-center shadow-[4px_4px_0px_#000000]">
                  <span className="font-extrabold text-lg text-black">01</span>
                </div>
                <div className="pl-12 relative z-10">
                  <h2 className="font-black text-2xl text-[#1A1C1B] uppercase border-b-[3px] border-black pb-1 inline-block">
                    Scrcpy & ADB Engine
                  </h2>
                </div>
              </div>

              <div className="bg-[#EEEEEC] border-[3px] border-black p-6 shadow-[8px_8px_0px_#000000] rounded-2xl flex flex-col gap-6">
                {/* Engine Status Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Scrcpy */}
                  <div className="p-4 bg-white border-[3px] border-black rounded-xl shadow-[3px_3px_0px_#000000] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm uppercase">Scrcpy Core</span>
                      {binaryStatus?.scrcpy_path ? (
                        <CheckCircle2 className="w-5 h-5 text-[#086E00]" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-[#BA1A1A]" />
                      )}
                    </div>
                    <p className="font-mono text-xs text-[#4E4633] font-bold">
                      {binaryStatus?.scrcpy_version || "Not installed"}
                    </p>
                    <p className="font-mono text-[10px] text-[#7F7660] truncate">
                      {binaryStatus?.scrcpy_path || "Path: None"}
                    </p>
                  </div>

                  {/* ADB */}
                  <div className="p-4 bg-white border-[3px] border-black rounded-xl shadow-[3px_3px_0px_#000000] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm uppercase">ADB Bridge</span>
                      {binaryStatus?.adb_path ? (
                        <CheckCircle2 className="w-5 h-5 text-[#086E00]" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-[#BA1A1A]" />
                      )}
                    </div>
                    <p className="font-mono text-xs text-[#4E4633] font-bold">
                      {binaryStatus?.adb_version || "Not installed"}
                    </p>
                    <p className="font-mono text-[10px] text-[#7F7660] truncate">
                      {binaryStatus?.adb_path || "Path: None"}
                    </p>
                  </div>
                </div>

                {/* Progress Bar Display */}
                {isDownloading && downloadProgress && (
                  <div className="p-4 bg-[#FFD027] border-[3px] border-black rounded-xl shadow-[4px_4px_0px_#000000] space-y-2">
                    <div className="flex justify-between font-extrabold text-xs uppercase">
                      <span>{downloadProgress.message}</span>
                      <span>{downloadProgress.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white border-[2.5px] border-black h-4 rounded-full overflow-hidden">
                      <div
                        className="bg-black h-full transition-all"
                        style={{ width: `${Math.max(5, downloadProgress.progress)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => downloadEngine()}
                    disabled={isDownloading}
                    className="bg-[#87F96E] border-[3px] border-black px-6 py-3 rounded-xl font-extrabold uppercase text-xs shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2 text-black cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isReady ? "Re-Download / Update Engine" : "1-Click Auto Install Engine"}</span>
                  </button>

                  <button
                    onClick={handleCheckUpdate}
                    disabled={isCheckingUpdate}
                    className="bg-white border-[3px] border-black px-5 py-3 rounded-xl font-extrabold uppercase text-xs shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={cn("w-4 h-4", isCheckingUpdate && "animate-spin")} />
                    <span>Check GitHub Releases</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Section 2: Directory Paths */}
          {activeSection === "paths" && (
            <section className="flex flex-col gap-4">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#FFC7CE] border-[3px] border-black rounded-full z-0 flex items-center justify-center shadow-[4px_4px_0px_#000000]">
                  <span className="font-extrabold text-lg text-[#AA2A4C]">02</span>
                </div>
                <div className="pl-12 relative z-10">
                  <h2 className="font-black text-2xl text-[#1A1C1B] uppercase border-b-[3px] border-black pb-1 inline-block">
                    Directory Paths
                  </h2>
                </div>
              </div>

              <div className="bg-[#EEEEEC] border-[3px] border-black p-6 shadow-[8px_8px_0px_#000000] rounded-2xl flex flex-col gap-6">
                {/* Custom ADB Path */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-xs uppercase text-[#1A1C1B] flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Custom ADB Path
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customAdbPath}
                      onChange={(e) => setCustomAdbPath(e.target.value)}
                      placeholder="e.g. C:\platform-tools\adb.exe"
                      className="flex-1 bg-white border-[3px] border-black p-3 font-mono font-bold text-xs shadow-[3px_3px_0px_#000000] outline-none"
                    />
                    <button
                      onClick={handleBrowseAdb}
                      className="bg-[#FFD027] border-[3px] border-black px-5 py-3 font-extrabold uppercase text-xs shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-pointer"
                    >
                      Browse
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold text-[#7F7660]">
                    Leave empty to use bundled or system PATH ADB.
                  </p>
                </div>

                <div className="w-full h-[2px] bg-black/20" />

                {/* Default Recordings Save Location */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-xs uppercase text-[#1A1C1B] flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Default Save Location (Recordings)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customRecordDir}
                      onChange={(e) => setCustomRecordDir(e.target.value)}
                      placeholder="e.g. C:\Users\Videos\ScrcpyCaptures"
                      className="flex-1 bg-white border-[3px] border-black p-3 font-mono font-bold text-xs shadow-[3px_3px_0px_#000000] outline-none"
                    />
                    <button
                      onClick={handleBrowseRecordDir}
                      className="bg-[#FFD027] border-[3px] border-black px-5 py-3 font-extrabold uppercase text-xs shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-pointer"
                    >
                      Browse
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section 3: Danger Zone */}
          {activeSection === "advanced" && (
            <section className="flex flex-col gap-4">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#BA1A1A] text-white border-[3px] border-black rounded-full z-0 flex items-center justify-center shadow-[4px_4px_0px_#000000]">
                  <span className="font-extrabold text-lg">03</span>
                </div>
                <div className="pl-12 relative z-10">
                  <h2 className="font-black text-2xl text-[#1A1C1B] uppercase border-b-[3px] border-black pb-1 inline-block">
                    Danger Zone
                  </h2>
                </div>
              </div>

              <div className="bg-[#FFDAD6] border-[3px] border-black p-6 shadow-[8px_8px_0px_#000000] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="font-black text-lg text-[#93000A] uppercase">
                    Factory Reset Config
                  </h3>
                  <p className="text-xs font-bold text-[#93000A]">
                    Reset all resolution, bitrate, audio, and device presets to default.
                  </p>
                </div>

                <button
                  onClick={() => {
                    resetToDefaults();
                    addNotification({
                      type: "info",
                      title: "Settings Reset",
                      message: "All parameters restored to defaults.",
                    });
                  }}
                  className="bg-[#BA1A1A] text-white border-[3px] border-black px-6 py-3 font-extrabold uppercase text-xs shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all whitespace-nowrap cursor-pointer"
                >
                  Reset All Settings
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

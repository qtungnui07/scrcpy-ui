import React, { useState } from "react";
import { useAdb } from "../../hooks/useAdb";
import { useScrcpy } from "../../hooks/useScrcpy";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Package,
  FileUp,
  Smartphone,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const ToolsView: React.FC = () => {
  const { devices, selectedSerial } = useAdb();
  const { installApk, pushFile } = useScrcpy();

  const [activeDeviceSerial, setActiveDeviceSerial] = useState(selectedSerial || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");

  const targetSerial = activeDeviceSerial || selectedSerial || devices[0]?.serial;
  const connectedDevices = devices.filter((d) => d.state === "device");

  const handlePickApk = async () => {
    if (!targetSerial) return;
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Android Application Package", extensions: ["apk", "xapk", "apks"] }],
      });

      if (selected && typeof selected === "string") {
        setIsProcessing(true);
        setStatusMessage(`Installing ${selected.split(/[/\\]/).pop()}...`);
        setStatusType("info");

        const ok = await installApk(targetSerial, selected);
        setIsProcessing(false);
        if (ok) {
          setStatusMessage("APK installed successfully on device!");
          setStatusType("success");
        } else {
          setStatusMessage("Failed to install APK. Check log drawer for details.");
          setStatusType("error");
        }
      }
    } catch (e: any) {
      setIsProcessing(false);
      setStatusMessage(String(e));
      setStatusType("error");
    }
  };

  const handlePickFiles = async () => {
    if (!targetSerial) return;
    try {
      const selected = await open({
        multiple: false,
      });

      if (selected && typeof selected === "string") {
        setIsProcessing(true);
        setStatusMessage(`Pushing ${selected.split(/[/\\]/).pop()} to /sdcard/Download/...`);
        setStatusType("info");

        const ok = await pushFile(targetSerial, selected, "/sdcard/Download/");
        setIsProcessing(false);
        if (ok) {
          setStatusMessage("File uploaded to /sdcard/Download/ on device!");
          setStatusType("success");
        } else {
          setStatusMessage("Failed to push file. Check log drawer.");
          setStatusType("error");
        }
      }
    } catch (e: any) {
      setIsProcessing(false);
      setStatusMessage(String(e));
      setStatusType("error");
    }
  };

  const shortcuts = [
    { key: "Mod + f", desc: "Switch fullscreen mode" },
    { key: "Mod + Left / Right", desc: "Rotate device display 90°" },
    { key: "Mod + g", desc: "Resize window to 1:1 pixel ratio" },
    { key: "Mod + w", desc: "Resize window to remove black borders" },
    { key: "Mod + h", desc: "Simulate HOME button" },
    { key: "Mod + b", desc: "Simulate BACK button" },
    { key: "Mod + s", desc: "Simulate APP_SWITCH (recent apps)" },
    { key: "Mod + p", desc: "Turn screen power on / off" },
    { key: "Mod + o", desc: "Turn device physical screen off (mirror stays on)" },
    { key: "Mod + Up / Down", desc: "Volume up / down" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-[#1A1C1B] drop-shadow-[3px_3px_0px_#000000]">
          Tools &amp; APK Installer
        </h1>
        <p className="text-sm font-semibold text-[#4E4633]">
          Transfer files, install Android APKs directly, and review Scrcpy shortcut hotkeys.
        </p>
      </div>

      {/* Target Device Selector */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#EEEEEC] border-[3px] border-black shadow-[4px_4px_0px_#000000]">
        <Smartphone className="w-5 h-5 text-black shrink-0" />
        <span className="font-extrabold text-xs uppercase text-[#1A1C1B] shrink-0">
          Target Phone:
        </span>
        {connectedDevices.length === 0 ? (
          <span className="text-xs font-bold text-[#BA1A1A] uppercase">
            No authorized devices connected
          </span>
        ) : (
          <select
            value={targetSerial}
            onChange={(e) => setActiveDeviceSerial(e.target.value)}
            className="flex-1 bg-white border-[2.5px] border-black p-2 font-bold text-xs shadow-[2px_2px_0px_#000000] outline-none cursor-pointer"
          >
            {connectedDevices.map((d) => (
              <option key={d.serial} value={d.serial}>
                {d.alias || d.model || d.serial} ({d.connection_type})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* APK & File Pusher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* APK Installer */}
        <div
          onClick={connectedDevices.length > 0 && !isProcessing ? handlePickApk : undefined}
          className={cn(
            "rounded-2xl border-[3px] border-black p-8 text-center bg-[#EEEEEC] shadow-[6px_6px_0px_#000000] flex flex-col items-center justify-center gap-4 select-none transition-all",
            connectedDevices.length > 0 && !isProcessing
              ? "cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              : "opacity-60 cursor-not-allowed"
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#FFD027] border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_#000000]">
            <Package className="w-8 h-8 text-black" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold uppercase text-[#1A1C1B]">Install APK Package</h3>
            <p className="text-xs font-bold text-[#4E4633] max-w-xs">
              Select any <b>.apk</b> file to install directly onto the device
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePickApk();
            }}
            disabled={connectedDevices.length === 0 || isProcessing}
            className="bg-[#FFD027] border-[2.5px] border-black px-6 py-2.5 rounded-xl font-black uppercase text-xs shadow-[3px_3px_0px_#000000] text-black cursor-pointer"
          >
            Select APK File
          </button>
        </div>

        {/* File Pusher */}
        <div
          onClick={connectedDevices.length > 0 && !isProcessing ? handlePickFiles : undefined}
          className={cn(
            "rounded-2xl border-[3px] border-black p-8 text-center bg-[#EEEEEC] shadow-[6px_6px_0px_#000000] flex flex-col items-center justify-center gap-4 select-none transition-all",
            connectedDevices.length > 0 && !isProcessing
              ? "cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              : "opacity-60 cursor-not-allowed"
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#87F96E] border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_#000000]">
            <FileUp className="w-8 h-8 text-black" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold uppercase text-[#1A1C1B]">Push File to Storage</h3>
            <p className="text-xs font-bold text-[#4E4633] max-w-xs">
              Upload photos, audio, videos, or documents to <b>/sdcard/Download/</b>
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePickFiles();
            }}
            disabled={connectedDevices.length === 0 || isProcessing}
            className="bg-[#87F96E] border-[2.5px] border-black px-6 py-2.5 rounded-xl font-black uppercase text-xs shadow-[3px_3px_0px_#000000] text-black cursor-pointer"
          >
            Select Local File
          </button>
        </div>
      </div>

      {/* Status Output */}
      {statusMessage && (
        <div
          className={cn(
            "p-4 border-[3px] border-black rounded-xl text-xs font-black uppercase flex items-center gap-3 shadow-[4px_4px_0px_#000000]",
            statusType === "success" && "bg-[#87F96E] text-black",
            statusType === "error" && "bg-[#FFDAD6] text-[#BA1A1A]",
            statusType === "info" && "bg-[#FFD027] text-black"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          ) : statusType === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : statusType === "error" ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : null}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Built-in Keyboard Shortcuts Reference */}
      <div className="rounded-2xl border-[3px] border-black bg-[#EEEEEC] p-6 shadow-[6px_6px_0px_#000000] space-y-4">
        <div className="flex items-center gap-2 border-b-[3px] border-black pb-2">
          <Keyboard className="w-5 h-5 text-black" />
          <h2 className="text-lg font-black uppercase tracking-tight text-[#1A1C1B]">
            Scrcpy Built-in Keyboard Shortcuts
          </h2>
        </div>

        <p className="text-xs font-bold text-[#4E4633]">
          <i>Note: <b>Mod</b> is <b>Left Alt</b> by default on Windows/Linux (or <b>Left Option / Command</b> on macOS).</i>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000000]"
            >
              <span className="font-bold text-xs text-[#1A1C1B]">{sc.desc}</span>
              <kbd className="px-2.5 py-1 bg-black text-[#FFD027] font-mono text-xs font-black border-[2px] border-black">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { useAdb } from "../../hooks/useAdb";
import { useScrcpy } from "../../hooks/useScrcpy";
import { Button } from "../ui/Button";
import { open } from "@tauri-apps/plugin-dialog";
import { Package, UploadCloud, FileUp, Smartphone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export const DropZone: React.FC = () => {
  const { devices, selectedSerial } = useAdb();
  const { installApk, pushFile } = useScrcpy();

  const [activeDeviceSerial, setActiveDeviceSerial] = useState(selectedSerial || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");

  // Keep synced with selectedSerial if not manually changed
  React.useEffect(() => {
    if (selectedSerial && !activeDeviceSerial) {
      setActiveDeviceSerial(selectedSerial);
    }
  }, [selectedSerial, activeDeviceSerial]);

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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-primary" />
          Device File Transfer & APK Manager
        </h3>
        <p className="text-xs text-muted-foreground">
          Quickly install APKs or push media and documents directly to your Android device
        </p>
      </div>

      {/* Target Device Selection */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-sm">
        <Smartphone className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs font-bold text-foreground shrink-0">Target Android Device:</span>
        {connectedDevices.length === 0 ? (
          <span className="text-xs text-amber-400 font-medium">No authorized devices connected</span>
        ) : (
          <select
            value={targetSerial}
            onChange={(e) => setActiveDeviceSerial(e.target.value)}
            className="flex-1 h-8 rounded-xl border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {connectedDevices.map((d) => (
              <option key={d.serial} value={d.serial} className="bg-card text-foreground">
                {d.alias || d.model || d.serial} ({d.connection_type})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* APK Installer Box */}
        <div
          onClick={connectedDevices.length > 0 && !isProcessing ? handlePickApk : undefined}
          className={cn(
            "rounded-2xl border border-dashed border-primary/30 p-8 text-center bg-card/40 transition-all flex flex-col items-center justify-center gap-3 select-none",
            connectedDevices.length > 0 && !isProcessing
              ? "cursor-pointer hover:border-primary hover:bg-card/70 hover:scale-[1.01]"
              : "opacity-60 cursor-not-allowed"
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner">
            <Package className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Install APK Package</h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              Click to select <b>.apk</b> file to install on the phone automatically
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            disabled={connectedDevices.length === 0 || isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              handlePickApk();
            }}
          >
            Select APK File
          </Button>
        </div>

        {/* File Pusher Box */}
        <div
          onClick={connectedDevices.length > 0 && !isProcessing ? handlePickFiles : undefined}
          className={cn(
            "rounded-2xl border border-dashed border-emerald-500/30 p-8 text-center bg-card/40 transition-all flex flex-col items-center justify-center gap-3 select-none",
            connectedDevices.length > 0 && !isProcessing
              ? "cursor-pointer hover:border-emerald-500 hover:bg-card/70 hover:scale-[1.01]"
              : "opacity-60 cursor-not-allowed"
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-inner">
            <FileUp className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Push File to Device</h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              Upload documents, videos, music, or photos into <b>/sdcard/Download/</b>
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            disabled={connectedDevices.length === 0 || isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              handlePickFiles();
            }}
          >
            Select Local File
          </Button>
        </div>
      </div>

      {/* Progress / Status banner */}
      {statusMessage && (
        <div
          className={cn(
            "p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn",
            statusType === "success" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
            statusType === "error" && "bg-rose-500/10 border-rose-500/30 text-rose-400",
            statusType === "info" && "bg-primary/10 border-primary/30 text-primary"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : statusType === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : statusType === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : null}
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}
    </div>
  );
};

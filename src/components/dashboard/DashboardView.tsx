import React from "react";
import { useAdb } from "../../hooks/useAdb";
import { useScrcpy } from "../../hooks/useScrcpy";
import { useDownloader } from "../../hooks/useDownloader";
import { useDeviceStore } from "../../stores/deviceStore";
import { useConfigStore } from "../../stores/configStore";
import { useAppStore } from "../../stores/appStore";
import { QuickActionsBar } from "../session/QuickActionsBar";
import {
  Smartphone,
  Wifi,
  Usb,
  Play,
  Square,
  Plus,
  RefreshCw,
  Video,
  AlertTriangle,
  Download,
  Cpu,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const DashboardView: React.FC = () => {
  const { devices, selectedSerial, refreshDevices } = useAdb();
  const { setSelectedSerial, setPairingModalOpen } = useDeviceStore();
  const { launchSession, stopSession, activeSessions } = useScrcpy();
  const { config, updateConfig } = useConfigStore();
  const binaryStatus = useAppStore((s) => s.binaryStatus);
  const downloadProgress = useAppStore((s) => s.downloadProgress);
  const isDownloading = useAppStore((s) => s.isDownloading);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const { downloadEngine } = useDownloader();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDevices();
    setIsRefreshing(false);
  };

  const engineReady = binaryStatus?.is_ready ?? false;

  const renderEngineBanner = () => {
    if (engineReady) return null;

    if (isDownloading && downloadProgress) {
      return (
        <div className="bg-[#FFF3C4] border-[3px] border-black rounded-2xl p-5 shadow-[4px_4px_0px_#000000] space-y-2">
          <div className="flex justify-between items-center font-extrabold text-xs uppercase text-[#1A1C1B]">
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4 animate-bounce" />
              {downloadProgress.message}
            </span>
            <span className="font-mono">{downloadProgress.progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-white border-[2.5px] border-black h-4 rounded-full overflow-hidden">
            <div
              className="bg-[#FFD027] h-full transition-all"
              style={{ width: `${Math.max(5, downloadProgress.progress)}%` }}
            />
          </div>
          <p className="text-[11px] font-bold text-[#7F7660]">
            ScrcpyHub is downloading the scrcpy &amp; adb engine in the background. Device
            discovery will start automatically once it finishes.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-[#FFDAD6] border-[3px] border-black rounded-2xl p-5 shadow-[4px_4px_0px_#000000] flex flex-col md:flex-row md:items-center gap-4">
        <div className="p-3 bg-white border-[2.5px] border-black rounded-xl shadow-[2px_2px_0px_#000000] shrink-0 w-fit">
          <Cpu className="w-6 h-6 text-[#BA1A1A]" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="font-extrabold text-sm uppercase text-[#BA1A1A]">
            scrcpy Engine Not Installed
          </h3>
          <p className="text-xs font-bold text-[#93000A] leading-relaxed">
            {binaryStatus === null
              ? "Checking for the scrcpy & adb engine..."
              : "ScrcpyHub could not find scrcpy or adb on this machine. Install the engine (one click, downloaded from the official GitHub release) to enable device discovery and mirroring."}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => downloadEngine()}
            className="bg-[#87F96E] border-[3px] border-black px-5 py-3 rounded-xl font-extrabold uppercase text-xs shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2 text-black cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Install Engine
          </button>
          <button
            onClick={() => setActiveTab("engine")}
            className="bg-white border-[3px] border-black px-5 py-3 rounded-xl font-extrabold uppercase text-xs shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] transition-all flex items-center gap-2 text-black cursor-pointer"
          >
            Engine Settings
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight text-[#1A1C1B]">
            Connected Devices
          </h1>
          <p className="text-sm font-semibold text-[#4E4633] mt-1">
            Real-time Android discovery over USB & Wi-Fi ({devices.length} active)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-[#EEEEEC] border-[3px] border-black px-4 py-2.5 rounded-xl font-bold uppercase text-xs shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            Refresh
          </button>

          <button
            onClick={() => setPairingModalOpen(true)}
            className="bg-[#FFD027] border-[3px] border-black px-5 py-2.5 rounded-xl font-extrabold uppercase text-xs shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2 text-black cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Pair Device
          </button>
        </div>
      </div>

      {/* Engine Status Banner (fresh install / missing binaries) */}
      {renderEngineBanner()}

      {/* Floating Controller for Selected Device */}
      <QuickActionsBar />

      {/* Device Cards Grid with Stitch Folder-Tabs */}
      {devices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {devices.map((device, index) => {
            const isSelected = device.serial === selectedSerial;
            const activeSession = activeSessions.find((s) => s.serial === device.serial);
            const isRunning = !!activeSession;
            const isUsb = device.connection_type === "USB";
            const isReady = device.state === "device";

            const tabBg = isRunning
              ? "bg-[#87F96E] text-black"
              : isReady
              ? index % 2 === 0
                ? "bg-[#87F96E] text-black"
                : "bg-[#FFC7CE] text-[#AA2A4C]"
              : "bg-[#FFDAD6] text-[#BA1A1A]";

            return (
              <div
                key={device.serial}
                onClick={() => setSelectedSerial(device.serial)}
                className="flex flex-col cursor-pointer group"
              >
                {/* Folder Tab Header */}
                <div
                  className={cn(
                    "w-3/4 border-[3px] border-black border-b-0 rounded-t-[16px] px-4 py-2 font-bold uppercase text-xs shadow-[4px_4px_0px_#000000] z-10 flex items-center gap-2 transition-all",
                    tabBg
                  )}
                >
                  <span
                    className={cn(
                      "w-3 h-3 rounded-full border-[2px] border-black",
                      isRunning
                        ? "bg-black animate-ping"
                        : isReady
                        ? "bg-[#086E00]"
                        : "bg-[#BA1A1A]"
                    )}
                  />
                  <span>
                    {isRunning ? "STREAMING NOW" : isReady ? "ONLINE READY" : device.state.toUpperCase()}
                  </span>
                </div>

                {/* Main Card Body */}
                <div
                  className={cn(
                    "bg-[#E2E3E1] border-[3px] border-black rounded-[16px] rounded-tl-none p-5 shadow-[4px_4px_0px_#000000] flex flex-col gap-3 relative -mt-[3px] z-20 transition-all",
                    isSelected
                      ? "ring-4 ring-black bg-[#EEEEEC] shadow-[6px_6px_0px_#000000] -translate-y-1"
                      : "hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000000]"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-extrabold text-xl text-[#1A1C1B] truncate">
                        {device.alias || device.model || device.product || device.serial}
                      </span>
                      <span className="font-bold text-xs text-[#4E4633] uppercase mt-0.5 font-mono">
                        {config.maxSize ? `${config.maxSize}p` : "NATIVE"} • {config.maxFps || 60} FPS
                      </span>
                      <span className="font-mono text-[11px] text-[#7F7660] truncate mt-1">
                        {device.serial}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl border-[2.5px] border-black bg-white shadow-[2px_2px_0px_#000000] shrink-0">
                      <Smartphone className="w-7 h-7 text-black" />
                    </div>
                  </div>

                  {/* Connection Tag */}
                  <div
                    className={cn(
                      "flex items-center gap-2 font-black text-xs uppercase border-[2.5px] border-black px-3 py-1.5 rounded-lg w-fit shadow-[2px_2px_0px_#000000]",
                      isUsb ? "bg-[#D9FFD0] text-[#086E00]" : "bg-[#DCE9FF] text-[#1D4ED8]"
                    )}
                  >
                    {isUsb ? (
                      <>
                        <Usb className="w-4 h-4" />
                        <span>USB • WIRED</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4" />
                        <span>WI-FI • TCP/IP</span>
                        {device.ip_address && (
                          <span className="font-mono text-[10px] normal-case text-[#1E40AF]">
                            {device.ip_address}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-2 pt-2 border-t-[2.5px] border-black/20">
                    {isReady ? (
                      <>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (isRunning && activeSession) {
                              await stopSession(activeSession.id);
                            } else {
                              await launchSession(device.serial);
                            }
                          }}
                          className={cn(
                            "flex-1 border-[3px] border-black py-2.5 px-4 rounded-xl shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all font-extrabold uppercase text-xs flex items-center justify-center gap-2 cursor-pointer",
                            isRunning
                              ? "bg-[#BA1A1A] text-white"
                              : "bg-[#FFD027] text-black"
                          )}
                        >
                          {isRunning ? (
                            <>
                              <Square className="w-4 h-4 fill-current" />
                              STOP STREAM
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 fill-current" />
                              START MIRROR
                            </>
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateConfig({ recordSession: !config.recordSession });
                          }}
                          title={config.recordSession ? "Auto-record ENABLED" : "Click to enable auto-record"}
                          className={cn(
                            "w-12 border-[3px] border-black rounded-xl shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center cursor-pointer",
                            config.recordSession
                              ? "bg-[#FF6B8B] text-white"
                              : "bg-[#F9F9F7] text-black hover:bg-[#FFDAD6]"
                          )}
                        >
                          <Video className={cn("w-5 h-5", config.recordSession && "animate-pulse")} />
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 p-2 rounded-xl bg-[#FFDAD6] border-[2.5px] border-black text-center text-xs font-bold text-[#BA1A1A] uppercase flex items-center justify-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Authorize on Phone
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="border-[3px] border-black rounded-2xl bg-[#EEEEEC] p-12 text-center shadow-[6px_6px_0px_#000000] space-y-5">
          <div className="w-20 h-20 bg-[#FFD027] border-[3px] border-black rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_#000000]">
            <Smartphone className="w-10 h-10 text-black" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold uppercase tracking-tight text-[#1A1C1B]">
              No Devices Connected
            </h2>
            <p className="text-xs font-bold text-[#4E4633] leading-relaxed">
              Connect your phone using a USB-C cable or tap below to open the Wireless Pairing wizard.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => setPairingModalOpen(true)}
              className="bg-[#FFD027] border-[3px] border-black px-6 py-3 rounded-xl font-extrabold uppercase text-xs shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] transition-all flex items-center gap-2 text-black cursor-pointer"
            >
              <Wifi className="w-4 h-4" />
              Pair Wireless Device
            </button>
            <button
              onClick={handleRefresh}
              className="bg-[#FFFFFF] border-[3px] border-black px-6 py-3 rounded-xl font-extrabold uppercase text-xs shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Scan USB Ports
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

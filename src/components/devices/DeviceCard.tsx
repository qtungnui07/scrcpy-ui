import React, { useState } from "react";
import { AdbDevice } from "../../types";
import { useDeviceStore } from "../../stores/deviceStore";
import { useScrcpy } from "../../hooks/useScrcpy";
import { useAdb } from "../../hooks/useAdb";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import {
  Smartphone,
  Wifi,
  Usb,
  BatteryCharging,
  Play,
  Square,
  Edit2,
  Unplug,
  Radio,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface DeviceCardProps {
  device: AdbDevice;
  isSelected: boolean;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, isSelected }) => {
  const { setSelectedSerial, updateDeviceAlias, setTcpipModalOpen } = useDeviceStore();
  const { launchSession, stopSession, activeSessions } = useScrcpy();
  const { disconnectDevice } = useAdb();

  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false);
  const [aliasInput, setAliasInput] = useState(device.alias || "");
  const [isLaunching, setIsLaunching] = useState(false);

  // Check if this device has an active running scrcpy session
  const activeSession = activeSessions.find((s) => s.serial === device.serial);
  const isRunning = !!activeSession;

  const handleLaunchOrStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning && activeSession) {
      await stopSession(activeSession.id);
    } else {
      setIsLaunching(true);
      try {
        await launchSession(device.serial);
      } finally {
        setIsLaunching(false);
      }
    }
  };

  const handleSaveAlias = () => {
    updateDeviceAlias(device.serial, aliasInput);
    setIsAliasModalOpen(false);
  };

  const isUsb = device.connection_type === "USB";
  const isDeviceReady = device.state === "device";

  const getStatusBadge = () => {
    switch (device.state) {
      case "device":
        return (
          <Badge variant="success" pulsing>
            Connected
          </Badge>
        );
      case "unauthorized":
        return (
          <Badge variant="warning">
            Unauthorized
          </Badge>
        );
      case "offline":
        return (
          <Badge variant="error">
            Offline
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral">
            {device.state}
          </Badge>
        );
    }
  };

  return (
    <>
      <div
        onClick={() => setSelectedSerial(device.serial)}
        className={cn(
          "relative rounded-2xl p-4 transition-all duration-200 cursor-pointer glass-card border select-none group",
          isSelected
            ? "border-primary ring-2 ring-primary/30 bg-card/90 shadow-xl"
            : "border-border/60 hover:border-primary/40 hover:bg-card/75"
        )}
      >
        {/* Active Session Indicator Glow */}
        {isRunning && (
          <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/60 pointer-events-none glow-emerald" />
        )}

        <div className="flex items-start justify-between gap-3">
          {/* Device Icon & Main Details */}
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={cn(
                "p-3 rounded-2xl shrink-0 transition-colors",
                isRunning
                  ? "bg-emerald-500/15 text-emerald-400"
                  : isSelected
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground group-hover:text-foreground"
              )}
            >
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground truncate text-sm">
                  {device.alias || device.model || device.product || device.serial}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAliasInput(device.alias || "");
                    setIsAliasModalOpen(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity p-0.5"
                  title="Rename device alias"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
                <span className="truncate max-w-[140px]" title={device.serial}>
                  {device.serial}
                </span>
              </div>

              {/* State, Connection, and Battery Pill */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {getStatusBadge()}

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/40">
                  {isUsb ? <Usb className="w-3 h-3 text-sky-400" /> : <Wifi className="w-3 h-3 text-indigo-400" />}
                  {device.connection_type}
                </span>

                {device.battery_level !== undefined && device.battery_level !== null && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <BatteryCharging className="w-3 h-3" />
                    {device.battery_level}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {isDeviceReady ? (
              <Button
                variant={isRunning ? "destructive" : isSelected ? "primary" : "secondary"}
                size="sm"
                onClick={handleLaunchOrStop}
                isLoading={isLaunching}
                className="shadow-md"
              >
                {isRunning ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Mirror
                  </>
                )}
              </Button>
            ) : (
              <div className="text-[11px] text-amber-400/90 font-medium px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                Check Phone Screen
              </div>
            )}

            {/* Sub actions */}
            <div className="flex items-center gap-1">
              {isUsb && isDeviceReady && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTcpipModalOpen(true, device.serial);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  title="Switch to Wireless Mode (TCP/IP)"
                >
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              )}

              {!isUsb && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnectDevice(device.serial);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-muted/60 transition-colors"
                  title="Disconnect Wireless Device"
                >
                  <Unplug className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rename Alias Modal */}
      <Modal
        isOpen={isAliasModalOpen}
        onClose={() => setIsAliasModalOpen(false)}
        title="Set Device Name"
        description={`Custom friendly name for ${device.serial}`}
      >
        <div className="space-y-4">
          <Input
            label="Friendly Name / Alias"
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            placeholder="e.g. My Galaxy S24, Office Pixel 8"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAliasModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveAlias}>
              Save Name
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

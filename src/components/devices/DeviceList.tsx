import React from "react";
import { useAdb } from "../../hooks/useAdb";
import { useDeviceStore } from "../../stores/deviceStore";
import { DeviceCard } from "./DeviceCard";
import { Button } from "../ui/Button";
import {
  Smartphone,
  Wifi,
  RefreshCw,
  Plus,
  History,
  Trash2,
  PlugZap,
  HelpCircle,
} from "lucide-react";

export const DeviceList: React.FC = () => {
  const { devices, selectedSerial, savedDevices, refreshDevices, connectDevice, removeSavedDevice } =
    useAdb();

  const { setPairingModalOpen } = useDeviceStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDevices();
    setIsRefreshing(false);
  };

  // Filter saved devices that are not currently active in `devices`
  const inactiveSavedDevices = savedDevices.filter(
    (s) => !devices.some((d) => d.serial.startsWith(s.ip))
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Connected Devices ({devices.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Auto-detected Android devices via USB and Wi-Fi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={isRefreshing}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          <Button variant="primary" size="sm" onClick={() => setPairingModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Pair / Connect Wireless
          </Button>
        </div>
      </div>

      {/* Connected Devices Grid */}
      {devices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((device) => (
            <DeviceCard
              key={device.serial}
              device={device}
              isSelected={device.serial === selectedSerial}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/30 backdrop-blur-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-bold text-foreground">No Android Devices Detected</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect your phone via USB cable or use Wireless Pairing over the local Wi-Fi network.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button variant="primary" size="sm" onClick={() => setPairingModalOpen(true)}>
              <Wifi className="w-3.5 h-3.5" />
              Pair Wireless Device
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={isRefreshing}>
              <RefreshCw className="w-3.5 h-3.5" />
              Scan Again
            </Button>
          </div>

          {/* Quick Help Accordion */}
          <div className="mt-6 pt-6 border-t border-border/40 text-left max-w-lg mx-auto text-xs text-muted-foreground space-y-2">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              First time setup troubleshooting:
            </div>
            <ol className="list-decimal list-inside space-y-1 leading-relaxed">
              <li>Open <b>Settings &gt; About Phone</b> and tap <b>Build Number 7 times</b>.</li>
              <li>Go to <b>System &gt; Developer Options</b> and enable <b>USB Debugging</b>.</li>
              <li>Plug into PC and click <b>Always allow from this computer</b> on your phone.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Saved / Bookmarked Devices History */}
      {inactiveSavedDevices.length > 0 && (
        <div className="pt-2 space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            Saved Wireless Devices ({inactiveSavedDevices.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inactiveSavedDevices.map((saved) => (
              <div
                key={saved.id}
                className="p-3.5 rounded-xl border border-border/50 bg-card/40 flex items-center justify-between gap-3 text-xs glass-card-hover"
              >
                <div className="min-w-0">
                  <div className="font-bold text-foreground truncate">{saved.alias}</div>
                  <div className="text-muted-foreground font-mono text-[11px] truncate">
                    {saved.ip}:{saved.port}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => connectDevice(saved.ip, saved.port, saved.alias)}
                    className="h-7 px-2.5 text-xs"
                  >
                    <PlugZap className="w-3 h-3" />
                    Connect
                  </Button>
                  <button
                    onClick={() => removeSavedDevice(saved.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-muted transition-colors"
                    title="Remove from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

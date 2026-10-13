import React, { useState } from "react";
import { useAdb } from "../../hooks/useAdb";
import { useScrcpy } from "../../hooks/useScrcpy";
import { useDeviceStore } from "../../stores/deviceStore";
import {
  Smartphone,
  Tablet,
  Search,
  ClipboardPaste,
  Cast,
  Plus,
  Trash2,
  PlugZap,
  Radio,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const DevicesView: React.FC = () => {
  const { devices, savedDevices, connectDevice, removeSavedDevice } = useAdb();
  const { launchSession, stopSession, activeSessions } = useScrcpy();
  const { setPairingModalOpen, setTcpipModalOpen } = useDeviceStore();

  const [searchQuery, setSearchQuery] = useState("");

  const handlePasteConnect = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.includes(".")) {
        const parts = text.trim().split(":");
        const ip = parts[0];
        const port = parts[1] ? parseInt(parts[1], 10) : 5555;
        await connectDevice(ip, port);
      } else {
        setPairingModalOpen(true);
      }
    } catch {
      setPairingModalOpen(true);
    }
  };

  const filteredDevices = devices.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.serial.toLowerCase().includes(q) ||
      (d.model && d.model.toLowerCase().includes(q)) ||
      (d.alias && d.alias.toLowerCase().includes(q)) ||
      (d.ip_address && d.ip_address.includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-[#1A1C1B]">
          Device Management
        </h1>
        <p className="text-sm font-semibold text-[#4E4633] max-w-2xl">
          Manage paired devices, connect new ones, and view connection history. Active devices appear first.
        </p>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 bg-[#E2E3E1] border-[3px] border-black rounded-xl p-3 shadow-[4px_4px_0px_#000000] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#4E4633] shrink-0" />
          <input
            type="text"
            placeholder="Search devices by name, IP, or serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-[#1A1C1B] placeholder:text-[#7F7660]"
          />
        </div>

        <button
          onClick={handlePasteConnect}
          className="bg-[#FFD027] border-[3px] border-black px-5 py-3 rounded-xl font-extrabold uppercase text-xs shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 text-black shrink-0 cursor-pointer"
        >
          <ClipboardPaste className="w-4 h-4" />
          <span>Paste & Connect IP</span>
        </button>

        <button
          onClick={() => setPairingModalOpen(true)}
          className="bg-[#87F96E] border-[3px] border-black px-5 py-3 rounded-xl font-extrabold uppercase text-xs shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 text-black shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Pair Android 11+</span>
        </button>
      </div>

      {/* Active Connections Table */}
      <div className="space-y-3">
        <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#1A1C1B] border-b-[3px] border-black pb-1.5 flex items-center justify-between">
          <span>Active Connections ({filteredDevices.length})</span>
        </h2>

        <div className="flex flex-col border-[3px] border-black rounded-2xl bg-[#EEEEEC] overflow-hidden shadow-[8px_8px_0px_#000000]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 p-4 bg-[#E2E3E1] border-b-[3px] border-black font-extrabold text-xs text-[#4E4633] uppercase tracking-wider">
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-4">Device Name</div>
            <div className="col-span-3">IP / Serial</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          {filteredDevices.length > 0 ? (
            filteredDevices.map((device) => {
              const activeSession = activeSessions.find((s) => s.serial === device.serial);
              const isRunning = !!activeSession;
              const isReady = device.state === "device";
              const isUsb = device.connection_type === "USB";

              return (
                <div
                  key={device.serial}
                  className="grid grid-cols-12 gap-3 p-4 items-center border-b-[3px] border-black last:border-b-0 bg-[#F9F9F7] hover:bg-[#F4F4F2] transition-colors"
                >
                  <div className="col-span-1 flex justify-center">
                    <div
                      className={cn(
                        "w-4 h-4 border-[2.5px] border-black rounded-full shadow-[2px_2px_0px_#000000]",
                        isRunning
                          ? "bg-[#87F96E] animate-ping"
                          : isReady
                          ? "bg-[#87F96E]"
                          : "bg-[#FFDAD6]"
                      )}
                    />
                  </div>

                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="p-2 border-[2px] border-black rounded-lg bg-white shadow-[2px_2px_0px_#000000] shrink-0">
                      <Smartphone className="w-5 h-5 text-black" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-sm text-[#1A1C1B] truncate">
                        {device.alias || device.model || device.product || device.serial}
                      </span>
                      <span className="font-mono text-xs text-[#7F7660] truncate">
                        {device.serial}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-3 font-mono font-bold text-xs text-[#4E4633] truncate">
                    {device.ip_address ? `${device.ip_address}:5555` : device.serial}
                  </div>

                  <div className="col-span-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 font-black text-[11px] uppercase border-[2px] border-black px-2.5 py-1 rounded-md shadow-[2px_2px_0px_#000000]",
                        isUsb ? "bg-[#D9FFD0] text-[#086E00]" : "bg-[#DCE9FF] text-[#1D4ED8]"
                      )}
                    >
                      {isUsb ? "USB • WIRED" : "WI-FI • TCP/IP"}
                    </span>
                  </div>

                  <div className="col-span-2 flex justify-end gap-2">
                    {isUsb && isReady && (
                      <button
                        onClick={() => setTcpipModalOpen(true, device.serial)}
                        title="Switch to Wireless TCP/IP"
                        className="bg-white border-[2.5px] border-black p-1.5 rounded-lg shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5 text-black" />
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        if (isRunning && activeSession) {
                          await stopSession(activeSession.id);
                        } else {
                          await launchSession(device.serial);
                        }
                      }}
                      className={cn(
                        "border-[2.5px] border-black px-3 py-1 rounded-lg shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all font-extrabold uppercase text-xs flex items-center gap-1.5 cursor-pointer",
                        isRunning ? "bg-[#BA1A1A] text-white" : "bg-[#FFD027] text-black"
                      )}
                    >
                      <Cast className="w-3.5 h-3.5" />
                      <span>{isRunning ? "Stop" : "Mirror"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs font-bold text-[#7F7660] uppercase">
              No active devices found. Check USB connection or pair a wireless device.
            </div>
          )}
        </div>
      </div>

      {/* Connection History Table */}
      {savedDevices.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#1A1C1B] border-b-[3px] border-black pb-1.5">
            Connection History & Saved Bookmarks ({savedDevices.length})
          </h2>

          <div className="flex flex-col border-[3px] border-black rounded-2xl bg-[#EEEEEC] overflow-hidden shadow-[8px_8px_0px_#000000]">
            <div className="grid grid-cols-12 gap-3 p-4 bg-[#E2E3E1] border-b-[3px] border-black font-extrabold text-xs text-[#4E4633] uppercase tracking-wider">
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-4">Device Name</div>
              <div className="col-span-3">IP Address</div>
              <div className="col-span-2">Last Connected</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {savedDevices.map((saved) => (
              <div
                key={saved.id}
                className="grid grid-cols-12 gap-3 p-4 items-center border-b-[3px] border-black last:border-b-0 bg-[#F9F9F7] opacity-90 hover:opacity-100 hover:bg-[#F4F4F2] transition-all"
              >
                <div className="col-span-1 flex justify-center">
                  <div className="w-4 h-4 bg-[#DADAD8] border-[2.5px] border-black rounded-full shadow-[2px_2px_0px_#000000]" />
                </div>

                <div className="col-span-4 flex items-center gap-3">
                  <Tablet className="w-5 h-5 text-black" />
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm text-[#1A1C1B]">{saved.alias}</span>
                    <span className="font-mono text-xs text-[#7F7660]">Wireless Bookmarked</span>
                  </div>
                </div>

                <div className="col-span-3 font-mono font-bold text-xs text-[#4E4633]">
                  {saved.ip}:{saved.port}
                </div>

                <div className="col-span-2 text-xs font-bold text-[#7F7660]">
                  {saved.lastConnected ? new Date(saved.lastConnected).toLocaleDateString() : "Saved"}
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => removeSavedDevice(saved.id)}
                    className="p-1.5 border-[2px] border-black rounded-lg bg-white shadow-[2px_2px_0px_#000000] hover:text-[#BA1A1A] cursor-pointer"
                    title="Remove device"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => connectDevice(saved.ip, saved.port, saved.alias)}
                    className="bg-[#87F96E] border-[2.5px] border-black px-3 py-1 rounded-lg shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all font-extrabold uppercase text-xs flex items-center gap-1.5 text-black cursor-pointer"
                  >
                    <PlugZap className="w-3.5 h-3.5" />
                    <span>Connect</span>
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

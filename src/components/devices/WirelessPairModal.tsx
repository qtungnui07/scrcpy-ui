import React, { useState, useEffect } from "react";
import { useAdb } from "../../hooks/useAdb";
import { useDeviceStore } from "../../stores/deviceStore";
import {
  Wifi,
  QrCode,
  ShieldCheck,
  Zap,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const WirelessPairModal: React.FC = () => {
  const {
    isPairingModalOpen,
    isTcpipModalOpen,
    activeDeviceIdForTcpip,
    setPairingModalOpen,
    setTcpipModalOpen,
    devices,
  } = useDeviceStore();

  const { pairDevice, connectDevice, enableTcpip, getDeviceWifiIp } = useAdb();

  const [tab, setTab] = useState<"pair11" | "tcpip" | "direct">("pair11");
  const [pairStep, setPairStep] = useState<1 | 2>(1);
  const [pairIp, setPairIp] = useState("");
  const [pairPort, setPairPort] = useState("37000");
  const [pairCode, setPairCode] = useState("");

  const [connectIp, setConnectIp] = useState("");
  const [connectPort, setConnectPort] = useState("5555");
  const [aliasName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedUsbSerial, setSelectedUsbSerial] = useState(activeDeviceIdForTcpip || "");
  const [detectedWifiIp, setDetectedWifiIp] = useState<string | null>(null);

  useEffect(() => {
    if (isTcpipModalOpen) {
      setTab("tcpip");
      if (activeDeviceIdForTcpip) {
        setSelectedUsbSerial(activeDeviceIdForTcpip);
      }
    }
  }, [isTcpipModalOpen, activeDeviceIdForTcpip]);

  useEffect(() => {
    if (tab === "tcpip" && selectedUsbSerial) {
      getDeviceWifiIp(selectedUsbSerial).then((ip) => {
        if (ip) {
          setDetectedWifiIp(ip);
          setConnectIp(ip);
        }
      });
    }
  }, [tab, selectedUsbSerial, getDeviceWifiIp]);

  const handlePair = async () => {
    if (!pairIp || !pairPort || !pairCode) return;
    setIsLoading(true);
    const success = await pairDevice(pairIp.trim(), parseInt(pairPort, 10), pairCode.trim());
    setIsLoading(false);
    if (success) {
      setConnectIp(pairIp.trim());
      setPairStep(2);
    }
  };

  const handleConnect = async () => {
    if (!connectIp || !connectPort) return;
    setIsLoading(true);
    const success = await connectDevice(
      connectIp.trim(),
      parseInt(connectPort, 10),
      aliasName.trim() || undefined
    );
    setIsLoading(false);
    if (success) {
      handleClose();
    }
  };

  const handleSwitchUsbToWifi = async () => {
    if (!selectedUsbSerial) return;
    setIsLoading(true);
    const port = parseInt(connectPort, 10) || 5555;
    const ok = await enableTcpip(selectedUsbSerial, port);
    if (ok) {
      const targetIp = detectedWifiIp || connectIp;
      if (targetIp) {
        await new Promise((r) => setTimeout(r, 1000));
        await connectDevice(targetIp, port, aliasName.trim() || undefined);
        setIsLoading(false);
        handleClose();
        return;
      }
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setPairingModalOpen(false);
    setTcpipModalOpen(false);
    setPairStep(1);
    setIsLoading(false);
  };

  const isOpen = isPairingModalOpen || isTcpipModalOpen;
  const usbDevices = devices.filter((d) => d.connection_type === "USB" && d.state === "device");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#EEEEEC] border-[3px] border-black p-6 rounded-2xl shadow-[10px_10px_0px_#000000] max-w-lg w-full space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b-[3px] border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#FFD027] border-[2px] border-black rounded-lg shadow-[2px_2px_0px_#000000]">
              <Wifi className="w-5 h-5 text-black" />
            </div>
            <h2 className="font-extrabold text-xl uppercase tracking-tight text-[#1A1C1B]">
              Wireless Pairing Wizard
            </h2>
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-[#DADAD8] rounded-md cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "pair11", label: "Android 11+ Pair", icon: <ShieldCheck className="w-4 h-4" /> },
            { id: "tcpip", label: "USB -> Wi-Fi", icon: <Zap className="w-4 h-4" /> },
            { id: "direct", label: "Direct IP", icon: <Wifi className="w-4 h-4" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={cn(
                "p-2.5 rounded-xl border-[2.5px] border-black font-extrabold text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                tab === t.id
                  ? "bg-[#FFD027] shadow-[3px_3px_0px_#000000] translate-x-[1px] translate-y-[1px]"
                  : "bg-white hover:bg-[#EEEEEC] shadow-[1px_1px_0px_#000000]"
              )}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Android 11+ */}
        {tab === "pair11" && (
          <div className="space-y-4">
            <div className="p-3 bg-[#FFD027]/20 border-[2.5px] border-black rounded-xl text-xs font-semibold space-y-1">
              <span className="font-black uppercase flex items-center gap-1.5 text-black">
                <QrCode className="w-4 h-4" />
                Phone Instructions:
              </span>
              <p className="text-[#4E4633]">
                Open <b>Settings &gt; Developer Options &gt; Wireless Debugging</b>, tap <b>Pair device with pairing code</b>.
              </p>
            </div>

            {pairStep === 1 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="font-extrabold text-xs uppercase">Device IP</label>
                    <input
                      type="text"
                      placeholder="192.168.1.50"
                      value={pairIp}
                      onChange={(e) => setPairIp(e.target.value)}
                      className="w-full bg-white border-[2.5px] border-black p-2.5 font-bold text-xs shadow-[2px_2px_0px_#000000] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-xs uppercase">Pair Port</label>
                    <input
                      type="text"
                      placeholder="37123"
                      value={pairPort}
                      onChange={(e) => setPairPort(e.target.value)}
                      className="w-full bg-white border-[2.5px] border-black p-2.5 font-bold text-xs shadow-[2px_2px_0px_#000000] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-xs uppercase">6-Digit Pairing Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={pairCode}
                    onChange={(e) => setPairCode(e.target.value)}
                    className="w-full bg-white border-[2.5px] border-black p-2.5 font-mono font-black text-lg tracking-widest text-center shadow-[2px_2px_0px_#000000] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleClose}
                    className="bg-white border-[2.5px] border-black px-4 py-2 font-bold uppercase text-xs shadow-[2px_2px_0px_#000000] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePair}
                    disabled={isLoading || !pairIp || !pairPort || !pairCode}
                    className="bg-[#87F96E] border-[2.5px] border-black px-5 py-2 font-black uppercase text-xs shadow-[4px_4px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] cursor-pointer"
                  >
                    {isLoading ? "Pairing..." : "Verify & Pair"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-[#87F96E]/20 border-[2.5px] border-black rounded-xl text-xs font-bold text-[#086E00] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  Pairing verified! Enter connection port from Wireless Debugging screen.
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="font-extrabold text-xs uppercase">Connect IP</label>
                    <input
                      type="text"
                      value={connectIp}
                      onChange={(e) => setConnectIp(e.target.value)}
                      className="w-full bg-white border-[2.5px] border-black p-2.5 font-bold text-xs shadow-[2px_2px_0px_#000000] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-xs uppercase">Port</label>
                    <input
                      type="text"
                      value={connectPort}
                      onChange={(e) => setConnectPort(e.target.value)}
                      className="w-full bg-white border-[2.5px] border-black p-2.5 font-bold text-xs shadow-[2px_2px_0px_#000000] outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between gap-2 pt-2">
                  <button
                    onClick={() => setPairStep(1)}
                    className="bg-white border-[2.5px] border-black px-4 py-2 font-bold uppercase text-xs shadow-[2px_2px_0px_#000000] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="bg-[#87F96E] border-[2.5px] border-black px-6 py-2 font-black uppercase text-xs shadow-[4px_4px_0px_#000000] cursor-pointer"
                  >
                    {isLoading ? "Connecting..." : "Connect Device"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: TCP/IP USB Switch */}
        {tab === "tcpip" && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-[#4E4633]">
              Unlocks TCP/IP port 5555 on your connected USB phone so you can unplug and mirror over Wi-Fi.
            </p>

            {usbDevices.length === 0 ? (
              <div className="p-4 bg-[#FFDAD6] border-[2.5px] border-black rounded-xl text-xs font-bold text-[#BA1A1A]">
                No USB devices detected. Connect your phone via USB cable first.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-xs uppercase">Select USB Phone</label>
                  <select
                    value={selectedUsbSerial}
                    onChange={(e) => setSelectedUsbSerial(e.target.value)}
                    className="w-full bg-white border-[2.5px] border-black p-2.5 font-bold text-xs shadow-[2px_2px_0px_#000000] outline-none"
                  >
                    {usbDevices.map((d) => (
                      <option key={d.serial} value={d.serial}>
                        {d.alias || d.model || d.serial} ({d.serial})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleClose}
                    className="bg-white border-[2.5px] border-black px-4 py-2 font-bold uppercase text-xs shadow-[2px_2px_0px_#000000] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSwitchUsbToWifi}
                    disabled={isLoading}
                    className="bg-[#87F96E] border-[2.5px] border-black px-6 py-2 font-black uppercase text-xs shadow-[4px_4px_0px_#000000] cursor-pointer"
                  >
                    {isLoading ? "Enabling..." : "1-Click Switch to Wi-Fi"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Direct IP */}
        {tab === "direct" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="font-extrabold text-xs uppercase">IP Address</label>
                <input
                  type="text"
                  placeholder="192.168.1.100"
                  value={connectIp}
                  onChange={(e) => setConnectIp(e.target.value)}
                  className="w-full bg-white border-[2.5px] border-black p-2.5 font-bold text-xs shadow-[2px_2px_0px_#000000] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-extrabold text-xs uppercase">Port</label>
                <input
                  type="text"
                  placeholder="5555"
                  value={connectPort}
                  onChange={(e) => setConnectPort(e.target.value)}
                  className="w-full bg-white border-[2.5px] border-black p-2.5 font-bold text-xs shadow-[2px_2px_0px_#000000] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleClose}
                className="bg-white border-[2.5px] border-black px-4 py-2 font-bold uppercase text-xs shadow-[2px_2px_0px_#000000] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={isLoading || !connectIp}
                className="bg-[#87F96E] border-[2.5px] border-black px-6 py-2 font-black uppercase text-xs shadow-[4px_4px_0px_#000000] cursor-pointer"
              >
                {isLoading ? "Connecting..." : "Connect IP"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

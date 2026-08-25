import React, { useState } from "react";
import { useScrcpy } from "../../hooks/useScrcpy";
import { useAdb } from "../../hooks/useAdb";
import {
  Power,
  Volume2,
  Volume1,
  VolumeX,
  Home,
  ArrowLeft,
  Square,
  Camera,
  Type,
  RotateCw,
  Moon,
  Sun,
  Send,
  Zap,
  X,
} from "lucide-react";

export const QuickActionsBar: React.FC = () => {
  const { selectedDevice, selectedSerial, rebootDevice } = useAdb();
  const { sendKey, sendText, takeScreenshot } = useScrcpy();

  const [isTextInputModalOpen, setIsTextInputModalOpen] = useState(false);
  const [isRebootModalOpen, setIsRebootModalOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);

  const activeSerial = selectedDevice?.serial || selectedSerial;
  const isReady = selectedDevice?.state === "device";

  if (!activeSerial || !isReady) {
    return null;
  }

  const handleSendText = async () => {
    if (!textInput.trim() || !activeSerial) return;
    await sendText(activeSerial, textInput.trim());
    setTextInput("");
    setIsTextInputModalOpen(false);
  };

  const handleScreenshot = async () => {
    if (!activeSerial) return;
    setIsTakingScreenshot(true);
    await takeScreenshot(activeSerial);
    setIsTakingScreenshot(false);
  };

  const handleReboot = async (target?: string) => {
    if (!activeSerial) return;
    await rebootDevice(activeSerial, target);
    setIsRebootModalOpen(false);
  };

  return (
    <>
      <div className="rounded-2xl border-[3px] border-black bg-[#EEEEEC] p-4 shadow-[6px_6px_0px_#000000] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#1A1C1B] uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#705900] fill-current" />
            Active Controller: {selectedDevice?.alias || selectedDevice?.model || activeSerial}
          </span>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-[2.5px] border-black shadow-[2px_2px_0px_#000000]">
            <button
              onClick={() => sendKey(activeSerial, 4, "Back")}
              title="Back (Key 4)"
              className="px-2.5 py-1.5 rounded-lg font-extrabold text-xs uppercase hover:bg-[#EEEEEC] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
              <span>Back</span>
            </button>
            <button
              onClick={() => sendKey(activeSerial, 3, "Home")}
              title="Home (Key 3)"
              className="px-2.5 py-1.5 rounded-lg font-extrabold text-xs uppercase hover:bg-[#EEEEEC] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 stroke-[3]" />
              <span>Home</span>
            </button>
            <button
              onClick={() => sendKey(activeSerial, 187, "Recent Apps")}
              title="Recents (Key 187)"
              className="px-2.5 py-1.5 rounded-lg font-extrabold text-xs uppercase hover:bg-[#EEEEEC] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 stroke-[3]" />
              <span>Recents</span>
            </button>
          </div>

          {/* Volume Controls */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-[2.5px] border-black shadow-[2px_2px_0px_#000000]">
            <button
              onClick={() => sendKey(activeSerial, 24, "Volume Up")}
              title="Volume Up"
              className="p-1.5 rounded-lg hover:bg-[#EEEEEC] cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => sendKey(activeSerial, 25, "Volume Down")}
              title="Volume Down"
              className="p-1.5 rounded-lg hover:bg-[#EEEEEC] cursor-pointer"
            >
              <Volume1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => sendKey(activeSerial, 164, "Volume Mute")}
              title="Mute"
              className="p-1.5 rounded-lg hover:bg-[#EEEEEC] cursor-pointer"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          </div>

          {/* Screen & Power */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-[2.5px] border-black shadow-[2px_2px_0px_#000000]">
            <button
              onClick={() => sendKey(activeSerial, 223, "Sleep Screen")}
              title="Sleep Screen (Key 223)"
              className="p-1.5 rounded-lg hover:bg-[#EEEEEC] text-[#705900] cursor-pointer"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => sendKey(activeSerial, 224, "Wake Screen")}
              title="Wake Screen (Key 224)"
              className="p-1.5 rounded-lg hover:bg-[#EEEEEC] text-[#705900] cursor-pointer"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => sendKey(activeSerial, 26, "Power Button")}
              title="Power Toggle (Key 26)"
              className="p-1.5 rounded-lg hover:bg-[#FFDAD6] text-[#BA1A1A] cursor-pointer"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>

          {/* Screenshot, Text, Reboot */}
          <button
            onClick={handleScreenshot}
            disabled={isTakingScreenshot}
            className="bg-white border-[2.5px] border-black px-3.5 py-1.5 rounded-xl font-extrabold uppercase text-xs shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#086E00]" />
            <span>Screenshot</span>
          </button>

          <button
            onClick={() => setIsTextInputModalOpen(true)}
            className="bg-white border-[2.5px] border-black px-3.5 py-1.5 rounded-xl font-extrabold uppercase text-xs shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Type className="w-4 h-4 text-[#705900]" />
            <span>Send Text</span>
          </button>

          <button
            onClick={() => setIsRebootModalOpen(true)}
            className="bg-white border-[2.5px] border-black px-3.5 py-1.5 rounded-xl font-extrabold uppercase text-xs shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-4 h-4 text-[#AD2C4F]" />
            <span>Reboot...</span>
          </button>
        </div>
      </div>

      {/* Send Text Modal */}
      {isTextInputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#EEEEEC] border-[3px] border-black p-6 rounded-2xl shadow-[8px_8px_0px_#000000] max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b-[3px] border-black pb-2">
              <h3 className="font-extrabold text-lg uppercase text-[#1A1C1B]">Send Text to Phone</h3>
              <button onClick={() => setIsTextInputModalOpen(false)} className="p-1 hover:bg-[#DADAD8] rounded-md cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Type text to type on Android..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendText();
              }}
              autoFocus
              className="w-full bg-white border-[3px] border-black p-3 font-bold text-sm outline-none shadow-[3px_3px_0px_#000000]"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsTextInputModalOpen(false)}
                className="bg-white border-[2.5px] border-black px-4 py-2 font-bold uppercase text-xs shadow-[2px_2px_0px_#000000] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendText}
                className="bg-[#FFD027] border-[2.5px] border-black px-5 py-2 font-black uppercase text-xs shadow-[3px_3px_0px_#000000] flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Send Input
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reboot Modal */}
      {isRebootModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#EEEEEC] border-[3px] border-black p-6 rounded-2xl shadow-[8px_8px_0px_#000000] max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b-[3px] border-black pb-2">
              <h3 className="font-extrabold text-lg uppercase text-[#1A1C1B]">Reboot Android Device</h3>
              <button onClick={() => setIsRebootModalOpen(false)} className="p-1 hover:bg-[#DADAD8] rounded-md cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => handleReboot("system")}
                className="bg-white border-[2.5px] border-black p-3 font-extrabold uppercase text-xs shadow-[3px_3px_0px_#000000] hover:bg-[#FFD027] text-left cursor-pointer"
              >
                1. Normal System Reboot
              </button>
              <button
                onClick={() => handleReboot("recovery")}
                className="bg-white border-[2.5px] border-black p-3 font-extrabold uppercase text-xs shadow-[3px_3px_0px_#000000] hover:bg-[#FFC7CE] text-left cursor-pointer"
              >
                2. Recovery Mode
              </button>
              <button
                onClick={() => handleReboot("bootloader")}
                className="bg-white border-[2.5px] border-black p-3 font-extrabold uppercase text-xs shadow-[3px_3px_0px_#000000] hover:bg-[#FFDAD6] text-left cursor-pointer"
              >
                3. Fastboot / Bootloader
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

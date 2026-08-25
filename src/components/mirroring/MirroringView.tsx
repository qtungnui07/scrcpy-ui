import React from "react";
import { useConfigStore } from "../../stores/configStore";
import { useAdb } from "../../hooks/useAdb";
import { useScrcpy } from "../../hooks/useScrcpy";
import { VideoCodec, AudioCodec, PresetKey } from "../../types";
import {
  Tv,
  ToggleRight,
  Play,
  Square,
  Cable,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const MirroringView: React.FC = () => {
  const { config, updateConfig, setPreset } = useConfigStore();
  const { selectedDevice, selectedSerial, devices } = useAdb();
  const { launchSession, stopSession, activeSessions } = useScrcpy();

  const targetSerial = selectedDevice?.serial || selectedSerial || devices[0]?.serial;
  const activeSession = activeSessions.find((s) => s.serial === targetSerial);
  const isRunning = !!activeSession;

  const presets: Array<{ key: PresetKey; label: string; bg: string }> = [
    { key: "gaming", label: "Ultra Gaming (0ms Buffer)", bg: "bg-[#FFD027]" },
    { key: "balanced", label: "Balanced 1080p", bg: "bg-[#87F96E]" },
    { key: "battery", label: "Battery Saver (Screen OFF)", bg: "bg-[#FFC7CE]" },
    { key: "recording", label: "Lossless Record", bg: "bg-[#EFC110]" },
  ];

  const handleStartOrStopStream = async () => {
    if (!targetSerial) return;
    if (isRunning && activeSession) {
      await stopSession(activeSession.id);
    } else {
      await launchSession(targetSerial);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-block border-[3px] border-black bg-[#FFD027] px-4 py-2 shadow-[4px_4px_0px_#000000] rounded-xl">
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#1A1C1B]">
            Mirroring Settings
          </h1>
        </div>
        <p className="text-sm font-semibold text-[#4E4633] bg-[#E8E8E6] border-[3px] border-black p-3.5 shadow-[4px_4px_0px_#000000] rounded-xl max-w-2xl">
          Configure the visual quality, framerate, buffer latency, and behavior of your stream.
        </p>
      </div>

      {/* Quick Preset Selector Chips */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-extrabold text-xs uppercase text-[#1A1C1B]">Presets:</span>
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={cn(
              "px-4 py-2 rounded-xl font-extrabold text-xs uppercase border-[3px] border-black transition-all cursor-pointer",
              config.preset === p.key
                ? `${p.bg} shadow-[4px_4px_0px_#000000] translate-x-[1px] translate-y-[1px]`
                : "bg-white hover:bg-[#EEEEEC] shadow-[2px_2px_0px_#000000]"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Slabs Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Quality Settings Slab (Left 7 cols) */}
        <div className="xl:col-span-7 bg-[#EEEEEC] border-[3px] border-black shadow-[6px_6px_0px_#000000] rounded-2xl flex flex-col overflow-hidden">
          {/* Slab Header */}
          <div className="bg-[#FFD027] border-b-[3px] border-black px-6 py-4 flex justify-between items-center">
            <h2 className="font-extrabold text-lg text-[#1A1C1B] uppercase flex items-center gap-2">
              <Tv className="w-6 h-6" />
              Stream Quality
            </h2>
            <span className="font-extrabold text-xs bg-white border-[2.5px] border-black px-2.5 py-1 rounded-md shadow-[2px_2px_0px_#000000] uppercase">
              {config.preset.toUpperCase()}
            </span>
          </div>

          <div className="p-6 flex flex-col gap-6 flex-1">
            {/* Bitrate Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="font-extrabold text-xs uppercase text-[#1A1C1B]">
                  Video Bitrate
                </label>
                <span className="font-extrabold text-xl text-[#735C00] font-mono">
                  {config.bitRate} Mbps
                </span>
              </div>

              <div className="relative h-10 flex items-center">
                <div className="w-full h-4 bg-white border-[3px] border-black rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-[#87F96E] border-r-[3px] border-black transition-all"
                    style={{ width: `${Math.min(100, (config.bitRate / 32) * 100)}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="2"
                  max="32"
                  step="2"
                  value={config.bitRate}
                  onChange={(e) => updateConfig({ bitRate: Number(e.target.value) })}
                  className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
              <div className="flex justify-between font-bold text-[11px] text-[#7F7660] uppercase">
                <span>Low (2M)</span>
                <span>Balanced (8M)</span>
                <span>Ultra (32M)</span>
              </div>
            </div>

            {/* Resolution Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="font-extrabold text-xs uppercase text-[#1A1C1B]">
                  Resolution Scaling
                </label>
                <span className="font-extrabold text-xl text-[#AD2C4F] font-mono">
                  {config.maxSize === 0 ? "100% Native" : `${config.maxSize}p`}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "480p", value: 480 },
                  { label: "720p", value: 720 },
                  { label: "1080p", value: 1080 },
                  { label: "Native", value: 0 },
                ].map((res) => (
                  <button
                    key={res.value}
                    onClick={() => updateConfig({ maxSize: res.value })}
                    className={cn(
                      "py-2 font-extrabold text-xs uppercase border-[2.5px] border-black rounded-xl transition-all cursor-pointer",
                      config.maxSize === res.value
                        ? "bg-[#FFC7CE] shadow-[3px_3px_0px_#000000] translate-x-[1px] translate-y-[1px]"
                        : "bg-white hover:bg-[#EEEEEC] shadow-[1px_1px_0px_#000000]"
                    )}
                  >
                    {res.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FPS Limit */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="font-extrabold text-xs uppercase text-[#1A1C1B]">
                  Max Frame Rate (FPS)
                </label>
                <span className="font-extrabold text-xl text-[#086E00] font-mono">
                  {config.maxFps === 0 ? "Max" : `${config.maxFps} FPS`}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: "30", value: 30 },
                  { label: "60", value: 60 },
                  { label: "90", value: 90 },
                  { label: "120", value: 120 },
                  { label: "Max", value: 0 },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => updateConfig({ maxFps: f.value })}
                    className={cn(
                      "py-2 font-extrabold text-xs uppercase border-[2.5px] border-black rounded-xl transition-all cursor-pointer",
                      config.maxFps === f.value
                        ? "bg-[#87F96E] shadow-[3px_3px_0px_#000000] translate-x-[1px] translate-y-[1px]"
                        : "bg-white hover:bg-[#EEEEEC] shadow-[1px_1px_0px_#000000]"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Codec Selectors */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="font-extrabold text-xs uppercase text-[#1A1C1B]">
                  Video Encoder (Codec)
                </label>
                <select
                  value={config.videoCodec}
                  onChange={(e) => updateConfig({ videoCodec: e.target.value as VideoCodec })}
                  className="w-full bg-white border-[3px] border-black font-extrabold text-xs text-[#1A1C1B] p-2.5 rounded-xl shadow-[3px_3px_0px_#000000] outline-none cursor-pointer"
                >
                  <option value="h264">H.264 (Default - Most Compatible)</option>
                  <option value="h265">H.265 (HEVC - Better Quality/Size)</option>
                  <option value="av1">AV1 (Experimental)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-xs uppercase text-[#1A1C1B]">
                  Audio Forwarding Codec
                </label>
                <select
                  value={config.audioCodec}
                  onChange={(e) => updateConfig({ audioCodec: e.target.value as AudioCodec })}
                  className="w-full bg-white border-[3px] border-black font-extrabold text-xs text-[#1A1C1B] p-2.5 rounded-xl shadow-[3px_3px_0px_#000000] outline-none cursor-pointer"
                >
                  <option value="opus">Opus (Recommended)</option>
                  <option value="aac">AAC (Standard)</option>
                  <option value="flac">FLAC (Lossless)</option>
                  <option value="raw">RAW PCM</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Behavior & Action Slab (Right 5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-[#EEEEEC] border-[3px] border-black shadow-[6px_6px_0px_#000000] rounded-2xl flex flex-col overflow-hidden">
            {/* Slab Header */}
            <div className="bg-[#FFC7CE] border-b-[3px] border-black px-6 py-4">
              <h2 className="font-extrabold text-lg text-[#AA2A4C] uppercase flex items-center gap-2">
                <ToggleRight className="w-6 h-6" />
                Behaviors & Flags
              </h2>
            </div>

            {/* Switches */}
            <div className="p-6 flex flex-col gap-4">
              {[
                {
                  id: "turnScreenOff",
                  label: "Turn Screen Off",
                  desc: "Keep phone screen black during mirror",
                  val: config.turnScreenOff,
                  setter: (v: boolean) => updateConfig({ turnScreenOff: v }),
                },
                {
                  id: "stayAwake",
                  label: "Stay Awake",
                  desc: "Prevent device from sleeping",
                  val: config.stayAwake,
                  setter: (v: boolean) => updateConfig({ stayAwake: v }),
                },
                {
                  id: "alwaysOnTop",
                  label: "Always On Top",
                  desc: "Pin mirror window above other windows",
                  val: config.alwaysOnTop,
                  setter: (v: boolean) => updateConfig({ alwaysOnTop: v }),
                },
                {
                  id: "showTouches",
                  label: "Show Touches",
                  desc: "Display touch dots when clicking",
                  val: config.showTouches,
                  setter: (v: boolean) => updateConfig({ showTouches: v }),
                },
                {
                  id: "recordSession",
                  label: "Record Stream",
                  desc: "Automatically save session to MP4",
                  val: config.recordSession,
                  setter: (v: boolean) => updateConfig({ recordSession: v }),
                },
              ].map((sw) => (
                <div
                  key={sw.id}
                  onClick={() => sw.setter(!sw.val)}
                  className="flex items-center justify-between p-3 border-[2.5px] border-black bg-white rounded-xl shadow-[2px_2px_0px_#000000] cursor-pointer hover:bg-[#F9F9F7] transition-all"
                >
                  <div className="flex flex-col pr-2">
                    <span className="font-extrabold text-xs uppercase text-[#1A1C1B]">
                      {sw.label}
                    </span>
                    <span className="text-[11px] font-semibold text-[#7F7660]">
                      {sw.desc}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "relative w-14 h-7 border-[2.5px] border-black rounded-lg transition-colors shadow-[1px_1px_0px_#000000] shrink-0",
                      sw.val ? "bg-[#87F96E]" : "bg-[#DADAD8]"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0 bottom-0 w-6 bg-black transition-transform duration-200",
                        sw.val ? "translate-x-7" : "translate-x-0"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MASSIVE ACTION BUTTON */}
          <button
            onClick={handleStartOrStopStream}
            disabled={!targetSerial}
            className={cn(
              "w-full border-[3px] border-black shadow-[6px_6px_0px_#000000] p-6 rounded-2xl hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[2px_2px_0px_#000000] transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
              isRunning ? "bg-[#BA1A1A] text-white" : "bg-[#87F96E] text-black"
            )}
          >
            <span className="font-black text-3xl uppercase tracking-tighter leading-none group-hover:scale-105 transition-transform flex items-center gap-3">
              {isRunning ? (
                <>
                  <Square className="w-8 h-8 fill-current" />
                  STOP STREAM
                </>
              ) : (
                <>
                  <Play className="w-8 h-8 fill-current" />
                  START STREAM
                </>
              )}
            </span>

            <span className="font-extrabold text-xs uppercase flex items-center gap-1.5 bg-black/10 px-4 py-1 rounded-full border-[2px] border-black">
              <Cable className={cn("w-4 h-4", isRunning && "animate-pulse")} />
              {targetSerial ? `TARGET: ${targetSerial}` : "NO DEVICE SELECTED"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { useConfigStore } from "../../stores/configStore";
import { Slider } from "../ui/Slider";
import { Switch } from "../ui/Switch";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { VideoCodec, AudioCodec } from "../../types";
import {
  Sliders,
  Tv,
  Film,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  Layers,
  Terminal,
} from "lucide-react";

export const AdvancedSettings: React.FC = () => {
  const { config, updateConfig, resetToDefaults, getCliPreview } = useConfigStore();
  const [copied, setCopied] = useState(false);

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(getCliPreview());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resolutionOptions = [
    { value: 0, label: "Original" },
    { value: 1920, label: "1080p (FHD)" },
    { value: 1280, label: "720p (HD)" },
    { value: 854, label: "480p (SD)" },
  ];

  const fpsOptions = [
    { value: 0, label: "Max" },
    { value: 30, label: "30 FPS" },
    { value: 60, label: "60 FPS" },
    { value: 90, label: "90 FPS" },
    { value: 120, label: "120 FPS" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            Parameter Customization & Fine-Tuning
          </h3>
          <p className="text-xs text-muted-foreground">
            Adjust stream resolution, codecs, performance toggles, and scrcpy flags
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={resetToDefaults}>
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </Button>
      </div>

      {/* Main Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Sliders & Codecs */}
        <div className="space-y-5 rounded-2xl border border-border/70 bg-card/50 p-5 backdrop-blur-sm">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
            <Tv className="w-3.5 h-3.5 text-primary" />
            Video & Audio Stream Parameters
          </h4>

          {/* Resolution */}
          <Slider
            label="Resolution Scaling (--max-size)"
            value={config.maxSize}
            min={0}
            max={1920}
            options={resolutionOptions}
            onChange={(val) => updateConfig({ maxSize: val })}
          />

          {/* Frame Rate */}
          <Slider
            label="Frame Rate Limit (--max-fps)"
            value={config.maxFps}
            min={0}
            max={120}
            options={fpsOptions}
            onChange={(val) => updateConfig({ maxFps: val })}
          />

          {/* Bitrate */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground uppercase">Bitrate (--video-bit-rate)</span>
              <span className="text-primary font-mono">{config.bitRate} Mbps</span>
            </div>
            <Slider
              value={config.bitRate}
              min={2}
              max={64}
              step={2}
              unit="M"
              onChange={(val) => updateConfig({ bitRate: val })}
            />
          </div>

          {/* Video Buffer */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground uppercase">Video Buffer Latency (--video-buffer)</span>
              <span className="text-primary font-mono">{config.videoBuffer} ms</span>
            </div>
            <Slider
              value={config.videoBuffer}
              min={0}
              max={200}
              step={10}
              unit="ms"
              onChange={(val) => updateConfig({ videoBuffer: val })}
            />
          </div>

          {/* Codec Selectors */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-primary" />
                Video Codec
              </label>
              <select
                value={config.videoCodec}
                onChange={(e) => updateConfig({ videoCodec: e.target.value as VideoCodec })}
                className="w-full h-9 rounded-xl border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="h264" className="bg-card">H.264 (Universal)</option>
                <option value="h265" className="bg-card">H.265 (High Efficiency)</option>
                <option value="av1" className="bg-card">AV1 (Next Gen)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-primary" />
                Audio Codec
              </label>
              <select
                value={config.audioCodec}
                onChange={(e) => updateConfig({ audioCodec: e.target.value as AudioCodec })}
                className="w-full h-9 rounded-xl border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="opus" className="bg-card">Opus (Recommended)</option>
                <option value="aac" className="bg-card">AAC (Standard)</option>
                <option value="flac" className="bg-card">FLAC (Lossless)</option>
                <option value="raw" className="bg-card">RAW PCM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Toggles & Behavior */}
        <div className="space-y-4 rounded-2xl border border-border/70 bg-card/50 p-5 backdrop-blur-sm">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Display & Hardware Controls
          </h4>

          <div className="divide-y divide-border/30">
            <Switch
              checked={config.turnScreenOff}
              onCheckedChange={(checked) => updateConfig({ turnScreenOff: checked })}
              label="Turn Physical Screen Off (--turn-screen-off)"
              description="Saves battery & keeps phone cold during mirror"
            />

            <Switch
              checked={config.stayAwake}
              onCheckedChange={(checked) => updateConfig({ stayAwake: checked })}
              label="Stay Awake (--stay-awake)"
              description="Prevents device from sleeping while plugged in"
            />

            <Switch
              checked={config.alwaysOnTop}
              onCheckedChange={(checked) => updateConfig({ alwaysOnTop: checked })}
              label="Always On Top (--always-on-top)"
              description="Pins the scrcpy window above all other windows"
            />

            <Switch
              checked={config.showTouches}
              onCheckedChange={(checked) => updateConfig({ showTouches: checked })}
              label="Show Touch Points (--show-touches)"
              description="Displays visual dots on screen when clicking / tapping"
            />

            <Switch
              checked={config.readOnly}
              onCheckedChange={(checked) => updateConfig({ readOnly: checked })}
              label="Read-Only Mode (--no-control)"
              description="Disable keyboard and mouse control on device"
            />

            <Switch
              checked={config.noAudio}
              onCheckedChange={(checked) => updateConfig({ noAudio: checked })}
              label="Mute Audio Forwarding (--no-audio)"
              description="Do not stream audio from device to PC"
            />

            <Switch
              checked={config.recordSession}
              onCheckedChange={(checked) => updateConfig({ recordSession: checked })}
              label="Record Session to Video File (--record)"
              description="Automatically records the entire mirror session to MP4"
            />
          </div>

          {/* Raw Arguments Input */}
          <div className="pt-2">
            <Input
              label="Custom Raw Scrcpy CLI Arguments"
              placeholder="e.g. --window-title='My Stream' --render-driver=opengl"
              value={config.rawArgs}
              onChange={(e) => updateConfig({ rawArgs: e.target.value })}
              helperText="Arguments are appended directly to the scrcpy command"
            />
          </div>
        </div>
      </div>

      {/* Live CLI Command Preview Card */}
      <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            Generated Scrcpy Execution Command
          </span>
          <Button variant="ghost" size="sm" onClick={handleCopyPreview} className="h-7 px-2.5 text-xs">
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy CLI
              </>
            )}
          </Button>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-indigo-300 select-all overflow-x-auto whitespace-pre">
          {getCliPreview()}
        </div>
      </div>
    </div>
  );
};

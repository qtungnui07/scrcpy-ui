import React from "react";
import { useConfigStore } from "../../stores/configStore";
import { PresetKey } from "../../types";
import { Gamepad2, Briefcase, BatteryCharging, Video, SlidersHorizontal, Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface PresetOption {
  key: PresetKey;
  title: string;
  badge: string;
  description: string;
  specs: string[];
  icon: React.ReactNode;
  gradient: string;
}

export const PresetSelector: React.FC = () => {
  const { config, setPreset } = useConfigStore();

  const presets: PresetOption[] = [
    {
      key: "gaming",
      title: "Ultra Performance",
      badge: "Gaming / Low Latency",
      description: "Zero latency buffer with high bitrate and pinned window for games.",
      specs: ["1080p", "60 FPS", "20 Mbps", "0ms Buffer", "Always On Top"],
      icon: <Gamepad2 className="w-5 h-5 text-indigo-400" />,
      gradient: "from-indigo-500/20 to-purple-500/10 border-indigo-500/30",
    },
    {
      key: "balanced",
      title: "Balanced Mode",
      badge: "Recommended / Office",
      description: "Optimal balance between smooth framerate, crisp text, and bandwidth.",
      specs: ["1080p", "60 FPS", "8 Mbps", "H.264", "Opus Audio"],
      icon: <Briefcase className="w-5 h-5 text-sky-400" />,
      gradient: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
    },
    {
      key: "battery",
      title: "Battery & Low Wi-Fi",
      badge: "Energy Saver",
      description: "Screen turned off on device with H.265 compression for weak Wi-Fi.",
      specs: ["720p", "30 FPS", "4 Mbps", "H.265 Codec", "Phone Screen OFF"],
      icon: <BatteryCharging className="w-5 h-5 text-emerald-400" />,
      gradient: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    },
    {
      key: "recording",
      title: "Lossless Recording",
      badge: "High Quality Capture",
      description: "Original full device resolution with 30Mbps bitrate saving to MP4 video.",
      specs: ["Original Res", "60 FPS", "30 Mbps", "Auto MP4 Record", "Stay Awake"],
      icon: <Video className="w-5 h-5 text-rose-400" />,
      gradient: "from-rose-500/20 to-orange-500/10 border-rose-500/30",
    },
    {
      key: "custom",
      title: "Custom Profile",
      badge: "Power User",
      description: "Fine-tune every resolution, FPS, bitrate, and scrcpy CLI argument manually.",
      specs: ["Custom Res", "Custom FPS", "Custom Flags", "Raw Args Box"],
      icon: <SlidersHorizontal className="w-5 h-5 text-amber-400" />,
      gradient: "from-amber-500/20 to-yellow-500/10 border-amber-500/30",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Streaming Presets</h3>
        <span className="text-xs text-muted-foreground">Select a preconfigured optimization</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {presets.map((p) => {
          const isSelected = config.preset === p.key;

          return (
            <div
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={cn(
                "relative rounded-2xl p-4 cursor-pointer transition-all duration-200 border text-left glass-card-hover flex flex-col justify-between select-none",
                isSelected
                  ? `ring-2 ring-primary border-primary bg-card/90 shadow-xl bg-gradient-to-br ${p.gradient}`
                  : "border-border/60 bg-card/50 hover:border-border"
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-muted/60 border border-border/40">
                    {p.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{p.title}</h4>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      {p.badge}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-3 mt-2 border-t border-border/30">
                {p.specs.map((spec, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-muted/80 text-foreground font-mono font-medium border border-border/40"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

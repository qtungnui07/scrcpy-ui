import React from "react";
import { Sparkles, Keyboard, Github, ExternalLink } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { Button } from "../ui/Button";

export const AboutView: React.FC = () => {
  const shortcuts = [
    { key: "Mod + f", desc: "Switch fullscreen mode" },
    { key: "Mod + Left / Right", desc: "Rotate device display 90°" },
    { key: "Mod + g", desc: "Resize window to 1:1 pixel ratio" },
    { key: "Mod + w", desc: "Resize window to remove black borders" },
    { key: "Mod + h", desc: "Simulate HOME button" },
    { key: "Mod + b", desc: "Simulate BACK button" },
    { key: "Mod + s", desc: "Simulate APP_SWITCH (recent apps)" },
    { key: "Mod + p", desc: "Turn screen power on / off" },
    { key: "Mod + o", desc: "Turn device physical screen off (mirror stays on)" },
    { key: "Mod + Up / Down", desc: "Volume up / down" },
    { key: "Mod + r", desc: "Rotate device screen" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero card */}
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/70 to-card/40 p-6 backdrop-blur-xl shadow-xl text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-primary/20 text-primary mx-auto flex items-center justify-center shadow-lg ring-4 ring-primary/10">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">ScrcpyHub v1.0.0</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Production-Grade Modern GUI Wrapper for Genymobile scrcpy & Android ADB
          </p>
        </div>
        <div className="flex justify-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => open("https://github.com/Genymobile/scrcpy")}
          >
            <Github className="w-3.5 h-3.5" />
            Genymobile Scrcpy
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* Scrcpy Shortcuts Table */}
      <div className="rounded-2xl border border-border/80 bg-card/50 p-5 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Scrcpy Built-in Keyboard Shortcuts
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          <i>Note: In Scrcpy, <b>Mod</b> key is <b>Left Alt</b> by default (or <b>Left Super / Command</b> on macOS).</i>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/40"
            >
              <span className="text-muted-foreground">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded bg-black/40 text-primary font-mono text-[11px] font-bold border border-primary/20">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

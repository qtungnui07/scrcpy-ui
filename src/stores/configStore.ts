import { create } from "zustand";
import { PresetKey, ScrcpyConfig } from "../types";

export const PRESET_DEFAULTS: Record<PresetKey, Partial<ScrcpyConfig>> = {
  gaming: {
    preset: "gaming",
    maxSize: 1080,
    maxFps: 60,
    bitRate: 20,
    videoCodec: "h264",
    audioCodec: "opus",
    videoBuffer: 0,
    turnScreenOff: false,
    stayAwake: true,
    noAudio: false,
    noVideo: false,
    alwaysOnTop: true,
    showTouches: false,
    powerOffOnClose: false,
    readOnly: false,
    recordSession: false,
    recordFormat: "mp4",
  },
  balanced: {
    preset: "balanced",
    maxSize: 1080,
    maxFps: 60,
    bitRate: 8,
    videoCodec: "h264",
    audioCodec: "opus",
    videoBuffer: 30,
    turnScreenOff: false,
    stayAwake: false,
    noAudio: false,
    noVideo: false,
    alwaysOnTop: false,
    showTouches: false,
    powerOffOnClose: false,
    readOnly: false,
    recordSession: false,
    recordFormat: "mp4",
  },
  battery: {
    preset: "battery",
    maxSize: 720,
    maxFps: 30,
    bitRate: 4,
    videoCodec: "h265",
    audioCodec: "opus",
    videoBuffer: 50,
    turnScreenOff: true,
    stayAwake: false,
    noAudio: false,
    noVideo: false,
    alwaysOnTop: false,
    showTouches: false,
    powerOffOnClose: false,
    readOnly: false,
    recordSession: false,
    recordFormat: "mp4",
  },
  recording: {
    preset: "recording",
    maxSize: 0,
    maxFps: 60,
    bitRate: 30,
    videoCodec: "h264",
    audioCodec: "opus",
    videoBuffer: 50,
    turnScreenOff: false,
    stayAwake: true,
    noAudio: false,
    noVideo: false,
    alwaysOnTop: false,
    showTouches: false,
    powerOffOnClose: false,
    readOnly: false,
    recordSession: true,
    recordFormat: "mp4",
  },
  custom: {
    preset: "custom",
    maxSize: 1080,
    maxFps: 60,
    bitRate: 12,
    videoCodec: "h264",
    audioCodec: "opus",
    videoBuffer: 20,
    turnScreenOff: false,
    stayAwake: false,
    noAudio: false,
    noVideo: false,
    alwaysOnTop: false,
    showTouches: false,
    powerOffOnClose: false,
    readOnly: false,
    recordSession: false,
    recordFormat: "mp4",
  },
};

const DEFAULT_CONFIG: ScrcpyConfig = {
  preset: "balanced",
  maxSize: 1080,
  maxFps: 60,
  bitRate: 8,
  videoCodec: "h264",
  audioCodec: "opus",
  videoBuffer: 30,
  turnScreenOff: false,
  stayAwake: false,
  noAudio: false,
  noVideo: false,
  alwaysOnTop: false,
  showTouches: false,
  powerOffOnClose: false,
  readOnly: false,
  recordSession: false,
  recordFormat: "mp4",
  rawArgs: "",
};

const CONFIG_STORAGE_KEY = "scrcpy_hub_config";

function loadSavedConfig(): ScrcpyConfig {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_CONFIG;
}

interface ConfigStore {
  config: ScrcpyConfig;
  setPreset: (preset: PresetKey) => void;
  updateConfig: (updates: Partial<ScrcpyConfig>) => void;
  resetToDefaults: () => void;
  buildCliArgs: () => string[];
  getCliPreview: () => string;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: loadSavedConfig(),

  setPreset: (preset) => {
    const defaults = PRESET_DEFAULTS[preset];
    const current = get().config;
    const updated = {
      ...current,
      ...defaults,
      preset,
    };
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    set({ config: updated });
  },

  updateConfig: (updates) => {
    const current = get().config;
    const updated = {
      ...current,
      ...updates,
      preset: updates.preset || "custom",
    };
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    set({ config: updated });
  },

  resetToDefaults: () => {
    try {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    set({ config: DEFAULT_CONFIG });
  },

  buildCliArgs: () => {
    const cfg = get().config;
    const args: string[] = [];

    // Resolution Scaling
    if (cfg.maxSize > 0) {
      args.push(`--max-size=${cfg.maxSize}`);
    }

    // Max FPS
    if (cfg.maxFps > 0) {
      args.push(`--max-fps=${cfg.maxFps}`);
    }

    // Video Bitrate
    if (cfg.bitRate > 0) {
      args.push(`--video-bit-rate=${cfg.bitRate}M`);
    }

    // Video Codec
    if (cfg.videoCodec && cfg.videoCodec !== "h264") {
      args.push(`--video-codec=${cfg.videoCodec}`);
    }

    // Audio Codec
    if (cfg.audioCodec && cfg.audioCodec !== "opus") {
      args.push(`--audio-codec=${cfg.audioCodec}`);
    }

    // Video Buffer
    if (cfg.videoBuffer > 0) {
      args.push(`--video-buffer=${cfg.videoBuffer}`);
    }

    // Switches
    if (cfg.turnScreenOff) {
      args.push("--turn-screen-off");
    }
    if (cfg.stayAwake) {
      args.push("--stay-awake");
    }
    if (cfg.noAudio) {
      args.push("--no-audio");
    }
    if (cfg.noVideo) {
      args.push("--no-video");
    }
    if (cfg.alwaysOnTop) {
      args.push("--always-on-top");
    }
    if (cfg.showTouches) {
      args.push("--show-touches");
    }
    if (cfg.powerOffOnClose) {
      args.push("--power-off-on-close");
    }
    if (cfg.readOnly) {
      args.push("--no-control");
    }

    // Recording
    if (cfg.recordSession) {
      const filename = cfg.recordPath || `recording_${Date.now()}.${cfg.recordFormat || "mp4"}`;
      args.push(`--record=${filename}`);
    }

    // Raw user args
    if (cfg.rawArgs && cfg.rawArgs.trim()) {
      const parts = cfg.rawArgs.trim().split(/\s+/);
      args.push(...parts);
    }

    return args;
  },

  getCliPreview: () => {
    const args = get().buildCliArgs();
    return `scrcpy ${args.join(" ")}`;
  },
}));

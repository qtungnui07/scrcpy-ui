export type DeviceState = "device" | "unauthorized" | "offline" | "connecting" | "unknown";
export type ConnectionType = "USB" | "Wireless";

export interface AdbDevice {
  serial: string;
  state: DeviceState;
  model?: string;
  product?: string;
  device?: string;
  transport_id?: string;
  connection_type: ConnectionType;
  ip_address?: string;
  battery_level?: number;
  alias?: string;
  is_bookmarked?: boolean;
}

export interface SavedDevice {
  id: string;
  ip: string;
  port: number;
  alias: string;
  lastConnected?: string;
  model?: string;
}

export interface BinaryStatus {
  scrcpy_path: string | null;
  adb_path: string | null;
  scrcpy_version: string | null;
  adb_version: string | null;
  is_ready: boolean;
  bin_dir: string;
  installed_tag: string | null;
}

export interface ReleaseInfo {
  tag_name: string;
  name: string;
  download_url: string;
  asset_name: string;
  size: u64_number;
  body: string;
}

export type u64_number = number;

export interface UpdateCheckResult {
  needs_update: boolean;
  installed_tag: string | null;
  latest_tag: string | null;
  auto_downloading: boolean;
  message: string;
}

export interface DownloadProgressPayload {
  stage: "fetching" | "downloading" | "extracting" | "finished" | "error";
  progress: number;
  downloaded_bytes: number;
  total_bytes: number;
  message: string;
}

export type PresetKey = "gaming" | "balanced" | "battery" | "recording" | "custom";
export type VideoCodec = "h264" | "h265" | "av1";
export type AudioCodec = "opus" | "aac" | "flac" | "raw";

export interface ScrcpyConfig {
  preset: PresetKey;
  maxSize: number; // 0 = original, 1080, 720, 480, etc.
  maxFps: number; // 0 = unlimited, 30, 60, 90, 120
  bitRate: number; // in Mbps, e.g. 8, 16, 24
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  videoBuffer: number; // in ms, 0 = no buffer
  turnScreenOff: boolean;
  stayAwake: boolean;
  noAudio: boolean;
  noVideo: boolean;
  alwaysOnTop: boolean;
  showTouches: boolean;
  powerOffOnClose: boolean;
  readOnly: boolean;
  recordSession: boolean;
  recordFormat: "mp4" | "mkv";
  recordPath?: string;
  rawArgs: string;
}

export interface ScrcpySession {
  id: string;
  serial: string;
  pid?: number;
  start_time: string;
  status: "running" | "stopped" | "error";
  args: string[];
}

export interface LogEntry {
  id: string;
  session_id: string;
  serial: string;
  level: "stdout" | "stderr" | "info" | "error";
  message: string;
  timestamp: string;
}

export interface CommandOutput {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code?: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: string;
}

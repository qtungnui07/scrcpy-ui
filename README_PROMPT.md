# Prompt Template / Project Specification: Scrcpy Modern GUI Manager

> **Hướng dẫn sử dụng:** Bạn có thể copy toàn bộ nội dung bên dưới dán thẳng vào Claude Code, Cursor, Windsurf, GitHub Copilot Workspace hoặc Gemini CLI để AI tự động scaffold, viết code và triển khai dự án từ đầu đến cuối.

---

```markdown
# MISSION & CONTEXT
You are an expert full-stack desktop application architect and system-level software engineer.
Your task is to build a complete, production-grade, modern desktop GUI wrapper for `scrcpy` (named **ScrcpyHub** / **scrcpy-gui**).

The goal is to provide a seamless, 1-click screen mirroring and device management experience for everyday users who find the CLI and ADB wireless pairing setup complicated.

---

## 1. TECH STACK REQUIREMENTS
- **Desktop Framework:** Tauri v2 (Rust backend) + React (TypeScript) + Vite
- **UI Library & Styling:** Tailwind CSS + shadcn/ui + Lucide Icons + Framer Motion
- **State Management:** Zustand or TanStack Query
- **IPC / Process Management:** Tauri Command IPC & `tokio::process::Command` in Rust
- **Target OS:** Windows, Linux, macOS (Cross-platform)

---

## 2. KEY FEATURES & SPECIFICATIONS

### A. Auto-Downloader & Engine Manager (Scrcpy & ADB)
1. **Engine Check:** On app startup, inspect the local binary directory (`./bin/` or AppData/Local folder).
2. **GitHub API Integration:** If binaries are missing or user clicks "Check Update", call GitHub Releases API (`https://api.github.com/repos/Genymobile/scrcpy/releases/latest`).
3. **Platform-Aware Download & Extraction:**
   - Detect host OS (Windows x64/arm64, Linux, macOS).
   - Download the official `.zip` / `.tar.gz` release asset with a visual progress bar.
   - Decompress and place `scrcpy`, `adb`, and dependent `.dll`/shared libraries into the local bin directory.
   - Set execution permissions (`chmod +x`) on Unix-like systems.

### B. Device Discovery & Connection Management
1. **USB Auto-Detect (Wired):**
   - Background polling daemon running `adb devices -l` every 2 seconds.
   - Parse device list: Serial ID, Product/Model name, Connection State (`device`, `unauthorized`, `offline`).
2. **Wireless Pairing Wizard (Android 11+ Pair & Connect):**
   - **Step 1 - Pairing:** Input `IP:Port` + `6-digit Pair Code` -> runs `adb pair <ip>:<port> <code>`.
   - **Step 2 - Connection:** Input `Connect IP:Port` -> runs `adb connect <ip>:<port>`.
   - Clear feedback toasts for success, timeout, or authorization denial.
3. **Legacy TCP/IP Connect (Android 10 & below):**
   - Option to enable TCP/IP port on a connected USB device: `adb tcpip 5555`, then connect via Wi-Fi.
4. **Device Bookmarking / History:**
   - Save frequently connected wireless devices (IP, Alias name, MAC/Model) to local storage.
   - 1-Click quick reconnect for saved devices.

### C. Streaming Profiles & Parameter Configuration
Generate the exact CLI arguments for `scrcpy` dynamically based on UI selections:
1. **Preset Modes:**
   - **Ultra Performance / Gaming:** 1080p/720p, 60/120 FPS, 16-24 Mbps, low latency buffer (`--video-buffer=0`).
   - **Balanced / Office:** 1080p, 60 FPS, 8 Mbps.
   - **Battery & Low Bandwidth:** 720p, 30 FPS, 4 Mbps, H.265 codec (`--video-codec=h265`).
   - **High Quality Record:** Original resolution, 30 Mbps, record to `.mp4` / `.mkv`.
2. **Custom Parameter Controls:**
   - `--max-size` (Resolution scaling: Original, 1080, 720, 480)
   - `--max-fps` (Frame rate: 30, 60, 90, 120, Unlimited)
   - `-b` / `--video-bit-rate` (Bitrate: 2M - 64M)
   - `--video-codec` (`h264`, `h265`, `av1`)
   - `--audio-codec` (`opus`, `aac`, `flac`, `raw`)
   - **Switches & Toggles:**
     - `--turn-screen-off` (Turn off physical phone screen during mirror)
     - `--stay-awake` (Prevent device from sleeping)
     - `--no-audio` / `--no-video`
     - `--always-on-top` (Pin scrcpy window)
     - `--show-touches` (Display touch indicators)
     - `--record=filename.mp4` (Auto-record session)
     - Custom raw argument input box for advanced power users.

### D. Session Controller & Floating Quick-Bar
1. Launch session via `scrcpy -s <serial> [args...]`.
2. Monitor child process status, stream stderr/stdout logs in real-time inside a dedicated "Log Viewer" drawer.
3. Quick actions per active session:
   - Screen off / Screen on (`scrcpy --turn-screen-off` or key shortcut).
   - Screenshot trigger (`adb exec-out screencap -p > capture.png`).
   - APK Drag-and-Drop installer (`adb install <filepath>`).
   - Push files to Android Download folder (`adb push <source> /sdcard/Download/`).
   - Power / Volume Up / Volume Down / Home / Back buttons via `adb shell input keyevent`.

---

## 3. PROJECT STRUCTURE & ARCHITECTURE

```
scrcpy-gui/
├── src-tauri/                 # Rust Backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs            # Entry point & IPC handler registration
│       ├── commands/
│       │   ├── adb.rs         # ADB process execution, parse devices, pair/connect
│       │   ├── scrcpy.rs      # Scrcpy process launcher & process supervisor
│       │   ├── downloader.rs  # GitHub Release fetcher, unzip & binary manager
│       │   └── mod.rs
│       └── utils/
│           ├── platform.rs    # OS detection & path resolver
│           └── mod.rs
├── src/                       # Frontend (React + TypeScript)
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── devices/
│   │   │   ├── DeviceCard.tsx
│   │   │   ├── DeviceList.tsx
│   │   │   └── WirelessPairModal.tsx
│   │   ├── settings/
│   │   │   ├── PresetSelector.tsx
│   │   │   ├── AdvancedSettings.tsx
│   │   │   └── BinaryStatusCard.tsx
│   │   ├── session/
│   │   │   ├── QuickActionsBar.tsx
│   │   │   └── LogViewerDrawer.tsx
│   │   └── ui/                # shadcn primitives (Button, Modal, Slider, Switch, etc.)
│   ├── stores/
│   │   ├── deviceStore.ts     # Device list & active selection
│   │   ├── configStore.ts     # Resolution, FPS, Bitrate, Flags
│   │   └── appStore.ts        # Download status, logs
│   ├── hooks/
│   │   ├── useAdb.ts
│   │   └── useDownloader.ts
│   └── types/
│       └── index.ts
├── package.json
└── vite.config.ts
```

---

## 4. STEP-BY-STEP IMPLEMENTATION PLAN

Please execute the implementation in sequential order:

1. **Step 1 - Scaffolding:** Initialize Tauri v2 + React TypeScript + Tailwind CSS setup.
2. **Step 2 - Rust Backend Commands:**
   - Implement binary resolution logic (check local bundled path vs system PATH).
   - Implement `download_engine` with progress streaming via Tauri events (`download-progress`).
   - Implement `get_adb_devices`, `pair_wireless_device`, `connect_wireless_device`.
   - Implement `launch_scrcpy_session` returning process PID.
3. **Step 3 - Frontend State & Stores:**
   - Build Zustand stores for configuration presets, device polling state, and live execution logs.
4. **Step 4 - UI Components:**
   - Build responsive Dark/Light UI with glassmorphic cards.
   - Device discovery view with animated status pulses (`Connected`, `Unauthorized`, `Offline`).
   - Interactive slider controls for FPS, Resolution, and Bitrate.
   - Drag-and-drop zone for APK installation and file pushes.
5. **Step 5 - Testing & Error Handling:**
   - Handle edge cases: Device disconnected mid-stream, port conflicts, pairing code mismatches, offline GitHub API.
```

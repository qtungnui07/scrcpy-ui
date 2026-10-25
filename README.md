# ScrcpyHub - Neo-Brutalist Android Control Center 📱⚡

A modern, high-performance desktop GUI wrapper for [Genymobile Scrcpy](https://github.com/Genymobile/scrcpy) and Android ADB, built with **Tauri v2 (Rust Backend)** + **React 19 (TypeScript)** + **Tailwind CSS** following the **Neo-Brutalism** design system.

![ScrcpyHub Banner](public/logo.svg)

---

## ✨ Features

- **🚀 1-Click Engine Auto-Installer:**
  - Automatically inspects and downloads official `scrcpy` and `adb` binaries directly from GitHub Releases with live download progress streaming.
- **🔌 Multi-Device Discovery:**
  - Auto-polls USB and Wi-Fi devices every 2s (`adb devices -l`).
  - Animated live status badges: `Active / Connected`, `Unauthorized`, `Offline`.
  - **Auto-Reconnect:** lost Wi-Fi devices are automatically re-connected (`adb connect`) with retry backoff, and mirroring sessions killed by an unexpected disconnect are restored with their original settings once the device is back online (both toggleable in Device Management).
- **📶 Wireless Pairing Wizard (Android 11+ & Legacy TCP/IP):**
  - **Android 11+:** 2-step pairing wizard with 6-digit pair code verification (`adb pair` & `adb connect`).
  - **Legacy TCP/IP:** 1-click automatic Wi-Fi IP detection and switch from USB to wireless mode (`adb tcpip 5555`).
  - Saved device bookmarks with quick 1-click reconnect.
- **🎮 Stream Quality Presets & Fine-Tuning:**
  - **Ultra Performance / Gaming:** 1080p, 60/120 FPS, 20 Mbps, 0ms buffer latency (`--video-buffer=0`).
  - **Balanced Mode:** 1080p, 60 FPS, 8 Mbps.
  - **Battery Saver:** 720p, 30 FPS, 4 Mbps, H.265 (`--video-codec=h265`, `--turn-screen-off`).
  - **Lossless MP4 Recording:** Original resolution, 30 Mbps, auto-save to `.mp4`.
  - Custom sliders for Bitrate, Max FPS, Resolution Scaling, Codecs (H.264, H.265, AV1, Opus, AAC, FLAC), and raw arguments input.
- **🎮 Quick Controller Bar:**
  - Hardware buttons: Power (`key 26`), Home (`key 3`), Back (`key 4`), Recents (`key 187`), Volume Up/Down/Mute.
  - Screen sleep (`key 223`) and wake (`key 224`).
  - Screenshot capture saved directly to disk.
  - Direct text/clipboard injection to Android input fields.
  - Quick reboot (System, Recovery, Bootloader).
- **📦 APK Installer & File Transfer:**
  - Select or drag-and-drop `.apk` packages to install (`adb install -r`).
  - Push documents, photos, and videos directly to `/sdcard/Download/`.
- **📜 Real-Time Log Console Drawer:**
  - Collapsible terminal drawer streaming stdout/stderr outputs in real-time with level filtering and search.

---

## 🛠️ Tech Stack

- **Desktop Framework:** [Tauri v2](https://v2.tauri.app/) (Rust)
- **Frontend UI:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Neo-Brutalist Theme)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Icons & Animation:** [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have installed:
- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://www.rust-lang.org/tools/install)

### 1. Installation

Clone the repository and install npm packages:

```bash
git clone https://github.com/qtungnui07/scrcpy-ui.git
cd scrcpy-ui
npm install
```

### 2. Run in Development Mode

```bash
npm run tauri dev
```

### 3. Build & Package for Release

To compile and package the production executable (`.exe` / `.app` / `.deb`):

```bash
npm run tauri build
```

The compiled binaries will be output to:
`src-tauri/target/release/`

---

## ⌨️ Scrcpy Built-in Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `Mod + f` | Switch fullscreen mode |
| `Mod + Left / Right` | Rotate display 90° |
| `Mod + g` | Resize window to 1:1 pixel ratio |
| `Mod + w` | Resize window to remove black borders |
| `Mod + h` | Simulate HOME button |
| `Mod + b` | Simulate BACK button |
| `Mod + s` | Simulate APP_SWITCH (recent apps) |
| `Mod + p` | Turn screen power on / off |
| `Mod + o` | Turn device physical screen off (mirror stays on) |
| `Mod + Up / Down` | Volume up / down |

> *Note: `Mod` key is **Left Alt** on Windows/Linux or **Left Option/Command** on macOS.*

---

## 📁 Project Structure

```
scrcpy-ui/
├── src-tauri/                 # Rust Backend (Tauri v2)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs            # Application entry point
│       ├── lib.rs             # Tauri command registration
│       ├── commands/
│       │   ├── adb.rs         # ADB discovery, pair, connect, keyevents
│       │   ├── scrcpy.rs      # Scrcpy process supervisor & log stream
│       │   └── downloader.rs  # GitHub Releases fetcher & extractor
│       └── utils/
│           └── platform.rs    # OS & binary path resolver
├── src/                       # Frontend (React 19 + TypeScript)
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── layout/            # Fixed Neo-Brutalist Sidebar
│   │   ├── dashboard/         # Folder-tab device cards & quick launcher
│   │   ├── devices/           # Device tables & wireless pair wizard
│   │   ├── mirroring/         # Stream quality slabs & chunky sliders
│   │   ├── settings/          # Paths & engine auto-downloader
│   │   ├── tools/             # APK installer, file push, shortcuts
│   │   ├── session/           # Floating controller & log drawer
│   │   └── ui/                # Neo-Brutalist UI primitives
│   ├── stores/                # Zustand stores (device, config, app)
│   ├── hooks/                 # Tauri IPC custom hooks
│   └── types/                 # TypeScript interfaces
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
`scrcpy` is an open-source project by [Genymobile](https://github.com/Genymobile/scrcpy).

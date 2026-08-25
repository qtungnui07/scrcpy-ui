import { create } from "zustand";
import { BinaryStatus, ReleaseInfo, DownloadProgressPayload, ScrcpySession, LogEntry } from "../types";

export type TabType = "devices" | "settings" | "logs" | "tools" | "engine" | "about";

export interface AppNotification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
  timestamp: number;
}

interface AppStore {
  binaryStatus: BinaryStatus | null;
  releaseInfo: ReleaseInfo | null;
  downloadProgress: DownloadProgressPayload | null;
  isDownloading: boolean;
  activeSessions: ScrcpySession[];
  logs: LogEntry[];
  isLogDrawerOpen: boolean;
  activeTab: TabType;
  theme: "dark" | "light";
  notifications: AppNotification[];

  setBinaryStatus: (status: BinaryStatus | null) => void;
  setReleaseInfo: (info: ReleaseInfo | null) => void;
  setDownloadProgress: (progress: DownloadProgressPayload | null) => void;
  setIsDownloading: (isDownloading: boolean) => void;
  setActiveSessions: (sessions: ScrcpySession[]) => void;
  addSession: (session: ScrcpySession) => void;
  removeSession: (sessionId: string) => void;
  addLog: (log: Omit<LogEntry, "id">) => void;
  clearLogs: () => void;
  setLogDrawerOpen: (open: boolean) => void;
  setActiveTab: (tab: TabType) => void;
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  binaryStatus: null,
  releaseInfo: null,
  downloadProgress: null,
  isDownloading: false,
  activeSessions: [],
  logs: [],
  isLogDrawerOpen: false,
  activeTab: "devices",
  theme: (localStorage.getItem("scrcpy_hub_theme") as "dark" | "light") || "dark",
  notifications: [],

  setBinaryStatus: (status) => set({ binaryStatus: status }),
  setReleaseInfo: (info) => set({ releaseInfo: info }),
  setDownloadProgress: (progress) => set({ downloadProgress: progress }),
  setIsDownloading: (isDownloading) => set({ isDownloading }),
  setActiveSessions: (sessions) => set({ activeSessions: sessions }),

  addSession: (session) => {
    const list = get().activeSessions.filter((s) => s.id !== session.id);
    set({ activeSessions: [...list, session] });
  },

  removeSession: (sessionId) => {
    set({ activeSessions: get().activeSessions.filter((s) => s.id !== sessionId) });
  },

  addLog: (log) => {
    const entry: LogEntry = {
      ...log,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    const current = get().logs;
    const trimmed = current.length > 1000 ? current.slice(current.length - 1000) : current;
    set({ logs: [...trimmed, entry] });
  },

  clearLogs: () => set({ logs: [] }),
  setLogDrawerOpen: (open) => set({ isLogDrawerOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("scrcpy_hub_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ theme: next });
  },

  setTheme: (theme) => {
    localStorage.setItem("scrcpy_hub_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ theme });
  },

  addNotification: (notif) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newNotif: AppNotification = {
      ...notif,
      id,
      timestamp: Date.now(),
    };
    set({ notifications: [...get().notifications, newNotif] });

    setTimeout(() => {
      get().removeNotification(id);
    }, 4000);
  },

  removeNotification: (id) => {
    set({ notifications: get().notifications.filter((n) => n.id !== id) });
  },
}));

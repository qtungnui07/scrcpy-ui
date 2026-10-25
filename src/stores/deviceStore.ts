import { create } from "zustand";
import { AdbDevice, SavedDevice } from "../types";

interface DeviceStore {
  devices: AdbDevice[];
  savedDevices: SavedDevice[];
  selectedSerial: string | null;
  isPairingModalOpen: boolean;
  isTcpipModalOpen: boolean;
  activeDeviceIdForTcpip: string | null;
  isPollingActive: boolean;
  autoReconnectWireless: boolean;

  setDevices: (devices: AdbDevice[]) => void;
  setSelectedSerial: (serial: string | null) => void;
  setPairingModalOpen: (open: boolean) => void;
  setTcpipModalOpen: (open: boolean, serial?: string | null) => void;
  setPollingActive: (active: boolean) => void;
  setAutoReconnectWireless: (enabled: boolean) => void;

  // Bookmarking & Saved Devices
  saveDevice: (device: Omit<SavedDevice, "id">) => void;
  removeSavedDevice: (id: string) => void;
  updateDeviceAlias: (serialOrIp: string, alias: string) => void;
}

const SAVED_DEVICES_KEY = "scrcpy_hub_saved_devices";
const DEVICE_ALIASES_KEY = "scrcpy_hub_device_aliases";
const AUTO_RECONNECT_KEY = "scrcpy_hub_auto_reconnect_wireless";

function loadAutoReconnect(): boolean {
  try {
    const stored = localStorage.getItem(AUTO_RECONNECT_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

function loadSavedDevices(): SavedDevice[] {
  try {
    const data = localStorage.getItem(SAVED_DEVICES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function loadAliases(): Record<string, string> {
  try {
    const data = localStorage.getItem(DEVICE_ALIASES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  devices: [],
  savedDevices: loadSavedDevices(),
  selectedSerial: null,
  isPairingModalOpen: false,
  isTcpipModalOpen: false,
  activeDeviceIdForTcpip: null,
  isPollingActive: true,
  autoReconnectWireless: loadAutoReconnect(),

  setDevices: (rawDevices) => {
    const aliases = loadAliases();
    const saved = get().savedDevices;

    const devices = rawDevices.map((d) => {
      const alias = aliases[d.serial] || aliases[d.ip_address || ""];
      const isBookmarked = saved.some((s) => s.ip === (d.ip_address || d.serial.split(":")[0]));
      return {
        ...d,
        alias: alias || d.alias,
        is_bookmarked: isBookmarked,
      };
    });

    const currentSelected = get().selectedSerial;
    // Auto select first device if none selected or if selected device disconnected
    let nextSelected = currentSelected;
    if (devices.length > 0) {
      if (!currentSelected || !devices.some((d) => d.serial === currentSelected)) {
        const firstActive = devices.find((d) => d.state === "device") || devices[0];
        nextSelected = firstActive.serial;
      }
    } else {
      nextSelected = null;
    }

    set({ devices, selectedSerial: nextSelected });
  },

  setSelectedSerial: (serial) => set({ selectedSerial: serial }),
  setPairingModalOpen: (open) => set({ isPairingModalOpen: open }),
  setTcpipModalOpen: (open, serial = null) =>
    set({ isTcpipModalOpen: open, activeDeviceIdForTcpip: serial }),
  setPollingActive: (active) => set({ isPollingActive: active }),

  setAutoReconnectWireless: (enabled) => {
    try {
      localStorage.setItem(AUTO_RECONNECT_KEY, String(enabled));
    } catch (e) {
      console.error(e);
    }
    set({ autoReconnectWireless: enabled });
  },

  saveDevice: (device) => {
    const current = get().savedDevices;
    const existingIndex = current.findIndex((d) => d.ip === device.ip && d.port === device.port);
    let updated: SavedDevice[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...device,
        lastConnected: new Date().toISOString(),
      };
    } else {
      const newDev: SavedDevice = {
        ...device,
        id: `${device.ip}:${device.port}-${Date.now()}`,
        lastConnected: new Date().toISOString(),
      };
      updated = [newDev, ...current];
    }

    try {
      localStorage.setItem(SAVED_DEVICES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    set({ savedDevices: updated });
  },

  removeSavedDevice: (id) => {
    const updated = get().savedDevices.filter((d) => d.id !== id);
    try {
      localStorage.setItem(SAVED_DEVICES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    set({ savedDevices: updated });
  },

  updateDeviceAlias: (serialOrIp, alias) => {
    const aliases = loadAliases();
    if (alias.trim()) {
      aliases[serialOrIp] = alias.trim();
    } else {
      delete aliases[serialOrIp];
    }
    try {
      localStorage.setItem(DEVICE_ALIASES_KEY, JSON.stringify(aliases));
    } catch (e) {
      console.error(e);
    }

    // Refresh devices aliases
    const updatedDevices = get().devices.map((d) => {
      if (d.serial === serialOrIp || d.ip_address === serialOrIp) {
        return { ...d, alias: alias.trim() || undefined };
      }
      return d;
    });
    set({ devices: updatedDevices });
  },
}));

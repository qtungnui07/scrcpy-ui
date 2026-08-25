import React from "react";
import { useAppStore, TabType } from "../../stores/appStore";
import { useScrcpy } from "../../hooks/useScrcpy";
import {
  LayoutGrid,
  Smartphone,
  Cast,
  Settings,
  UploadCloud,
  Square,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();
  const { activeSessions, stopAllSessions } = useScrcpy();

  const navItems: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: "devices", label: "Dashboard", icon: <LayoutGrid className="w-5 h-5" /> },
    { id: "tools", label: "Devices", icon: <Smartphone className="w-5 h-5" /> },
    { id: "settings", label: "Mirroring", icon: <Cast className="w-5 h-5" /> },
    { id: "about", label: "Tools & APK", icon: <UploadCloud className="w-5 h-5" /> },
    { id: "engine", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-[#EEEEEC] border-r-[3px] border-black flex flex-col z-40 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b-[3px] border-black bg-[#FFD027]">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-3xl tracking-tighter uppercase text-[#1A1C1B] drop-shadow-[3px_3px_0px_#000000]">
            SCRCPY
          </span>
          <span className="px-2 py-0.5 text-xs font-bold bg-black text-white rounded-md uppercase">
            HUB v1.0
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col gap-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 border-[3px] font-bold uppercase transition-all text-left text-sm tracking-wide rounded-lg",
                isActive
                  ? "bg-[#FFD027] text-black border-black shadow-[4px_4px_0px_#000000] translate-x-[2px] translate-y-[2px]"
                  : "border-transparent text-[#1A1C1B] hover:border-black hover:bg-[#E8E8E6] active:translate-x-[2px] active:translate-y-[2px]"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Active Sessions Counter & Quick Stop */}
        {activeSessions.length > 0 && (
          <div className="mt-auto p-4 border-[3px] border-black rounded-xl bg-[#FFDAD6] shadow-[4px_4px_0px_#000000] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[#93000A] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A] animate-ping" />
                {activeSessions.length} Streaming Active
              </span>
            </div>
            <button
              onClick={() => stopAllSessions()}
              className="w-full bg-[#BA1A1A] text-white border-[2.5px] border-black py-1.5 px-3 rounded-lg font-bold text-xs uppercase shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none flex items-center justify-center gap-1.5 active:translate-x-[2px] active:translate-y-[2px]"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop All Streams
            </button>
          </div>
        )}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t-[3px] border-black bg-[#E2E3E1] text-[11px] font-bold text-[#4E4633] uppercase flex items-center justify-between">
        <span>Neo-Brutalist Engine</span>
        <span className="flex items-center gap-1 text-black font-mono">
          <Sparkles className="w-3.5 h-3.5 text-[#705900]" /> READY
        </span>
      </div>
    </aside>
  );
};

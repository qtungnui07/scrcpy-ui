import React from "react";
import { useAppStore } from "./stores/appStore";
import { useDownloader } from "./hooks/useDownloader";
import { Sidebar } from "./components/layout/Sidebar";
import { DashboardView } from "./components/dashboard/DashboardView";
import { DevicesView } from "./components/devices/DevicesView";
import { MirroringView } from "./components/mirroring/MirroringView";
import { ToolsView } from "./components/tools/ToolsView";
import { SettingsView } from "./components/settings/SettingsView";
import { WirelessPairModal } from "./components/devices/WirelessPairModal";
import { LogViewerDrawer } from "./components/session/LogViewerDrawer";
import { NotificationToastContainer } from "./components/ui/NotificationToast";

export const App: React.FC = () => {
  const { activeTab } = useAppStore();
  useDownloader(); // auto-check for scrcpy updates on startup

  return (
    <div className="flex h-screen bg-[#F9F9F7] text-[#1A1C1B] font-['Space_Grotesk',sans-serif] overflow-hidden select-none">
      {/* Left Fixed Neo-Brutalist Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-72 h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 pb-20">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === "devices" && <DashboardView />}
            {activeTab === "tools" && <DevicesView />}
            {activeTab === "settings" && <MirroringView />}
            {activeTab === "about" && <ToolsView />}
            {activeTab === "engine" && <SettingsView />}
          </div>
        </main>

        {/* Real-time Log Console Drawer */}
        <LogViewerDrawer />
      </div>

      {/* Wireless Pair Modal Dialog */}
      <WirelessPairModal />

      {/* Toast Notifications */}
      <NotificationToastContainer />
    </div>
  );
};

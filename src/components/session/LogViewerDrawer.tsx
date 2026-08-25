import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "../../stores/appStore";
import { Terminal, Trash2, Copy, Check, ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "../../lib/utils";

export const LogViewerDrawer: React.FC = () => {
  const { logs, clearLogs, isLogDrawerOpen, setLogDrawerOpen } = useAppStore();
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== "all" && log.level !== filterLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return log.message.toLowerCase().includes(q) || log.serial.toLowerCase().includes(q);
    }
    return true;
  });

  useEffect(() => {
    if (isLogDrawerOpen) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs.length, isLogDrawerOpen]);

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.serial}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "stderr":
      case "error":
        return "text-[#FF6B8B]";
      case "info":
        return "text-[#87F96E]";
      case "stdout":
      default:
        return "text-[#FFD027]";
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-72 right-0 border-t-[3px] border-black bg-[#EEEEEC] transition-all duration-300 flex flex-col z-30",
        isLogDrawerOpen ? "h-64 shadow-[0px_-6px_0px_#000000]" : "h-11 shadow-[0px_-2px_0px_#000000]"
      )}
    >
      {/* Header Bar */}
      <div
        onClick={() => setLogDrawerOpen(!isLogDrawerOpen)}
        className="h-11 px-5 flex items-center justify-between cursor-pointer select-none bg-[#E2E3E1] border-b-[2px] border-black"
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-black" />
          <span className="font-extrabold text-xs uppercase text-[#1A1C1B] tracking-wider">
            Scrcpy Console Output
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-[#FFD027] border-[2px] border-black font-black uppercase shadow-[1px_1px_0px_#000000]">
            {logs.length} EVENTS
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isLogDrawerOpen ? (
            <>
              {/* Filter */}
              <div className="flex items-center gap-1">
                {["all", "stdout", "stderr", "error"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setFilterLevel(lvl)}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-black uppercase border-[2px] border-black transition-all",
                      filterLevel === lvl
                        ? "bg-[#FFD027] shadow-[1px_1px_0px_#000000]"
                        : "bg-white hover:bg-[#DADAD8]"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyLogs}
                className="p-1 border-[2px] border-black bg-white rounded-md hover:bg-[#FFD027] shadow-[1px_1px_0px_#000000]"
                title="Copy logs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={clearLogs}
                className="p-1 border-[2px] border-black bg-white rounded-md hover:bg-[#FFDAD6] shadow-[1px_1px_0px_#000000]"
                title="Clear logs"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#BA1A1A]" />
              </button>

              <button
                onClick={() => setLogDrawerOpen(false)}
                className="p-1 border-[2px] border-black bg-white rounded-md shadow-[1px_1px_0px_#000000]"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setLogDrawerOpen(true)}
              className="flex items-center gap-1 font-extrabold text-xs uppercase text-black"
            >
              <span>Show Logs</span>
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal View */}
      {isLogDrawerOpen && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#1A1C1B] p-3 text-white">
          <div className="flex items-center gap-2 px-2 pb-2 border-b border-white/20">
            <Search className="w-4 h-4 text-white/50 shrink-0" />
            <input
              type="text"
              placeholder="Filter live log output..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none font-mono"
            />
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px] p-2 space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-white/40 py-6">
                No logs recorded. Launch a mirror session or run commands to stream output.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed break-all">
                  <span className="text-white/40 select-none shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={cn("font-bold uppercase shrink-0", getLevelColor(log.level))}>
                    [{log.level}]
                  </span>
                  <span className="text-white/60 shrink-0">[{log.serial}]</span>
                  <span className={cn("flex-1", getLevelColor(log.level))}>{log.message}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

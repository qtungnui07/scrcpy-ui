import React, { useState } from "react";
import { useDownloader } from "../../hooks/useDownloader";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowDownCircle,
  ExternalLink,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";

export const BinaryStatusCard: React.FC = () => {
  const {
    binaryStatus,
    releaseInfo,
    downloadProgress,
    isDownloading,
    checkLatest,
    downloadEngine,
  } = useDownloader();

  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    const rel = await checkLatest();
    setIsCheckingUpdate(false);
    if (rel) {
      setIsReleaseModalOpen(true);
    }
  };

  const isReady = binaryStatus?.is_ready ?? false;

  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 p-5 backdrop-blur-xl shadow-lg relative overflow-hidden">
      {/* Background glow when ready vs missing */}
      <div
        className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isReady ? "bg-emerald-500" : "bg-rose-500"
        }`}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Engine Status Details */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Engine & Binary Manager
            </h3>
            <Badge variant={isReady ? "success" : "error"} pulsing={isReady}>
              {isReady ? "Ready & Operational" : "Binaries Missing"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Scrcpy Info */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {binaryStatus?.scrcpy_path ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground">Scrcpy Core</div>
                <div className="text-muted-foreground truncate font-mono mt-0.5">
                  {binaryStatus?.scrcpy_version || "Not found"}
                </div>
                <div className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                  {binaryStatus?.scrcpy_path || "Path: None"}
                </div>
              </div>
            </div>

            {/* ADB Info */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {binaryStatus?.adb_path ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground">Android ADB Bridge</div>
                <div className="text-muted-foreground truncate font-mono mt-0.5">
                  {binaryStatus?.adb_version || "Not found"}
                </div>
                <div className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                  {binaryStatus?.adb_path || "Path: None"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap md:flex-col gap-2 shrink-0 justify-end">
          <Button
            variant={isReady ? "secondary" : "primary"}
            size="sm"
            onClick={() => downloadEngine()}
            isLoading={isDownloading}
            className="w-full sm:w-auto"
          >
            <Download className="w-3.5 h-3.5" />
            {isReady ? "Re-download Engine" : "1-Click Auto Install"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckUpdate}
            isLoading={isCheckingUpdate}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Updates
          </Button>
        </div>
      </div>

      {/* Progress Bar Display */}
      {isDownloading && downloadProgress && (
        <div className="mt-4 p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2 animate-pulse-slow">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-primary flex items-center gap-1.5">
              <ArrowDownCircle className="w-3.5 h-3.5 animate-bounce" />
              {downloadProgress.message}
            </span>
            <span className="font-mono font-bold text-foreground">
              {downloadProgress.progress.toFixed(0)}%
            </span>
          </div>

          <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-indigo-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, downloadProgress.progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Release Notes Modal */}
      <Modal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        title={releaseInfo?.name || "Scrcpy Latest Release"}
        description={`Tag: ${releaseInfo?.tag_name || "Latest"}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="max-h-60 overflow-y-auto p-3 rounded-xl bg-muted/40 font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed border border-border/50">
            {releaseInfo?.body || "No release notes available."}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (releaseInfo?.download_url) {
                  open(releaseInfo.download_url);
                }
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View on GitHub
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsReleaseModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsReleaseModalOpen(false);
                  downloadEngine(releaseInfo?.download_url);
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Download This Version
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

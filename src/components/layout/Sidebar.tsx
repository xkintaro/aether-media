import { motion } from "framer-motion";
import { Settings, RotateCcw, Play, Zap, Square } from "lucide-react";
import { useToastStore } from "@/store/toastStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useQueueStore } from "@/store/queueStore";
import { useConversionQueue } from "@/hooks";
import { SettingsPanel } from "@/components/settings";
import { open } from "@tauri-apps/plugin-dialog";
import { RetryModal } from "@/components/ui/RetryModal";
import { cn } from "@/lib/utils";
import { SIDEBAR_WIDTH, TOOLBAR_HEIGHT } from "@/lib/constants";
import { useState } from "react";

export function Sidebar() {
  const {
    settings,
    updateSettings,
    outputDirectory,
    setOutputDirectory,
    resetSettings,
  } = useSettingsStore();
  const { items } = useQueueStore();
  const { addToast } = useToastStore();
  const { startProcessing, stopProcessing, isProcessing } =
    useConversionQueue();
  const [isResetCooldown, setIsResetCooldown] = useState(false);
  const [isProcessingCooldown, setIsProcessingCooldown] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);

  const hasVideo = items.some((i) => i.mediaType === "video");
  const hasImage = items.some((i) => i.mediaType === "image");
  const hasAudio = items.some((i) => i.mediaType === "audio");
  const isEmpty = items.length === 0;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const hasAnyPendingOrCancelled = items.some(
    (i) => i.status === "pending" || i.status === "cancelled",
  );
  const totalProcessable =
    pendingCount +
    items.filter((i) => i.status === "cancelled").length +
    errorCount;

  const triggerCooldown = () => {
    setIsProcessingCooldown(true);
    setTimeout(() => setIsProcessingCooldown(false), 1500);
  };

  const handleSelectOutputDir = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Output Directory",
    });
    if (selected) {
      setOutputDirectory(selected as string);
    }
  };

  const handleToggleProcessing = () => {
    if (isProcessingCooldown) return;

    if (isProcessing) {
      stopProcessing();
      triggerCooldown();
    } else {
      if (errorCount > 0) {
        setShowRetryModal(true);
      } else if (hasAnyPendingOrCancelled) {
        startProcessing(false);
        triggerCooldown();
      }
    }
  };

  const handleRetryConfirm = () => {
    setShowRetryModal(false);
    startProcessing(true);
    triggerCooldown();
  };

  const handleRetrySkip = () => {
    setShowRetryModal(false);
    startProcessing(false);
    triggerCooldown();
  };

  const handleReset = () => {
    if (isResetCooldown) return;
    resetSettings();
    addToast("Global settings reset to defaults", "info");

    setIsResetCooldown(true);
    setTimeout(() => setIsResetCooldown(false), 2000);
  };

  return (
    <aside
      style={{ width: SIDEBAR_WIDTH }}
      className="border-r border-border-subtle bg-surface-secondary/30 flex flex-col"
    >
      {!isEmpty && (
        <div
          style={{ height: TOOLBAR_HEIGHT }}
          className="p-4 border-b border-border-subtle"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-smoke">
              <Settings className="w-4 h-4 text-neon-cyan" />
              <span className="text-sm font-medium">Global Settings</span>
            </div>
            <button
              onClick={handleReset}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isResetCooldown
                  ? "text-ash/50"
                  : "text-ash hover:text-smoke hover:bg-slate/50",
              )}
              title="Reset to defaults"
              disabled={isEmpty || isResetCooldown}
            >
              <RotateCcw
                className={cn(
                  "w-4 h-4",
                  (isEmpty || isResetCooldown) && "opacity-50",
                  isResetCooldown && "animate-spin-reverse-slow",
                )}
              />
            </button>
          </div>
          <p className="text-xs text-ash mt-1">Applies to all files</p>
        </div>
      )}
      <motion.div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
            <div className="w-12 h-12 rounded-2xl bg-slate/30 border border-slate flex items-center justify-center rotate-3">
              <Zap className="w-6 h-6 text-ash" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-smoke">
                Waiting for Files
              </p>
              <p className="text-xs text-ash px-4">
                Drag media files to the list to configure output format and
                other settings.
              </p>
            </div>
          </div>
        ) : (
          <SettingsPanel
            settings={settings}
            onSettingsChange={updateSettings}
            hasVideo={hasVideo}
            hasImage={hasImage}
            hasAudio={hasAudio}
            mode="global"
            showOutputDir={true}
            outputDirectory={outputDirectory}
            onSelectOutputDir={handleSelectOutputDir}
          />
        )}
      </motion.div>
      {!isEmpty && (
        <div className="border-t border-border-subtle p-4 space-y-3">
          <div>
            <button
              onClick={handleToggleProcessing}
              disabled={
                (totalProcessable === 0 && !isProcessing) ||
                isProcessingCooldown
              }
              className={cn(
                "btn-neon w-full disabled:cursor-not-allowed",
                isProcessing
                  ? "bg-danger-red text-snow hover:bg-danger-red/80 border-danger-red"
                  : totalProcessable > 0
                    ? ""
                    : "bg-zinc/50 text-ash border-transparent hover:bg-zinc/50 hover:border-transparent hover:text-ash",
                isProcessingCooldown && "opacity-70 cursor-wait",
              )}
            >
              {isProcessing ? (
                <>
                  <Square
                    className={cn(
                      "w-4 h-4",
                      isProcessingCooldown && "animate-pulse",
                    )}
                  />
                  {isProcessingCooldown ? "Wait..." : "Stop"}
                </>
              ) : (
                <>
                  {totalProcessable > 0 ? (
                    <>
                      <Play
                        className={cn(
                          "w-4 h-4",
                          isProcessingCooldown && "opacity-50",
                        )}
                      />
                      {isProcessingCooldown
                        ? "Wait..."
                        : `Process ${totalProcessable} Files`}
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Add Files
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      )}
      <RetryModal
        isOpen={showRetryModal}
        onClose={() => setShowRetryModal(false)}
        onRetry={handleRetryConfirm}
        onSkip={handleRetrySkip}
        errorCount={errorCount}
      />
    </aside>
  );
}

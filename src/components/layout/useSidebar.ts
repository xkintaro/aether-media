import { useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useToastStore } from "@/store/toastStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useQueueStore } from "@/store/queueStore";
import { useConversionQueue } from "@/hooks";
import { computeQueueStats } from "@/lib/utils";

export function useSidebar() {
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

  const {
    hasVideo,
    hasImage,
    hasAudio,
    originalVideoFormats,
    originalImageFormats,
    originalAudioFormats,
    errorCount,
    hasAnyPendingOrCancelled,
    totalProcessable,
    isEmpty,
  } = useMemo(() => {
    const stats = computeQueueStats(items);
    let video = false,
      image = false,
      audio = false;
    let cancelled = 0;
    const videoFormats = new Set<string>();
    const imageFormats = new Set<string>();
    const audioFormats = new Set<string>();

    for (const item of items) {
      const ext = item.inputPath.split(".").pop()?.toLowerCase();
      if (item.mediaType === "video") {
        video = true;
        if (ext) videoFormats.add(ext);
      } else if (item.mediaType === "image") {
        image = true;
        if (ext) imageFormats.add(ext === "jpeg" ? "jpg" : ext);
      } else if (item.mediaType === "audio") {
        audio = true;
        if (ext) audioFormats.add(ext);
      }
      if (item.status === "cancelled") cancelled++;
    }
    return {
      hasVideo: video,
      hasImage: image,
      hasAudio: audio,
      originalVideoFormats: Array.from(videoFormats),
      originalImageFormats: Array.from(imageFormats),
      originalAudioFormats: Array.from(audioFormats),
      pendingCount: stats.pending,
      errorCount: stats.error,
      hasAnyPendingOrCancelled: stats.pending > 0 || cancelled > 0,
      totalProcessable: stats.pending + cancelled + stats.error,
      isEmpty: items.length === 0,
    };
  }, [items]);

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

  return {
    settings,
    updateSettings,
    outputDirectory,
    isProcessing,
    isResetCooldown,
    isProcessingCooldown,
    showRetryModal,
    setShowRetryModal,
    hasVideo,
    hasImage,
    hasAudio,
    originalVideoFormats,
    originalImageFormats,
    originalAudioFormats,
    errorCount,
    totalProcessable,
    isEmpty,
    handleSelectOutputDir,
    handleToggleProcessing,
    handleRetryConfirm,
    handleRetrySkip,
    handleReset,
  };
}

import { useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TAURI_COMMANDS } from "@/lib/constants";
import { computeQueueStats } from "@/lib/utils";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useQueueStore } from "@/store/queueStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useAppSettingsStore } from "@/store/appSettingsStore";
import { useToastStore } from "@/store/toastStore";
import { getDefaultOutputFormat, DEFAULT_RANDOM_LENGTH } from "@/types";
import type {
  ConversionSettings,
  ProgressEvent,
  ConversionResult,
  ItemStatus,
} from "@/types";

interface UseConversionQueueReturn {
  startProcessing: (retryErrors?: boolean) => void;
  stopProcessing: () => void;
  processSelectedItems: () => void;
  isProcessing: boolean;
}

export function useConversionQueue(): UseConversionQueueReturn {
  const {
    isProcessing,
    setIsProcessing,
    updateProgress,
    updateStatus,
    setOutputPath,
    getSelectedItems,
    getNextPendingItem,
  } = useQueueStore();

  const { settings: globalSettings, outputDirectory } = useSettingsStore();
  const { addToast } = useToastStore();
  const processingRef = useRef(false);
  const currentItemRef = useRef<string | null>(null);

  const getMergedSettings = useCallback(
    (overrides?: Partial<ConversionSettings>): ConversionSettings => {
      return {
        ...globalSettings,
        outputDirectory: outputDirectory || undefined,
        ...(overrides || {}),
      };
    },
    [globalSettings, outputDirectory],
  );

  const showCompletionToasts = useCallback(
    (stats: {
      processed: number;
      success: number;
      error: number;
      cancelled: number;
    }) => {
      if (stats.processed === 0) return;
      const summaryText = `${stats.processed} files processed`;
      addToast(summaryText, "info", 5000);
      if (stats.success > 0) {
        addToast(`${stats.success} files successful`, "success", 5000);
      }
      if (stats.error > 0) {
        addToast(`${stats.error} files failed`, "error", 5000);
      }
      if (stats.cancelled > 0) {
        addToast(`${stats.cancelled} files cancelled`, "warning", 5000);
      }
    },
    [addToast],
  );

  const processItem = useCallback(
    async (itemId: string): Promise<ItemStatus> => {
      const item = useQueueStore.getState().items.find((i) => i.id === itemId);
      if (!item) return "error";

      currentItemRef.current = itemId;
      updateStatus(itemId, "processing");

      let finalStatus: ItemStatus = "error";

      try {
        const mergedSettings = getMergedSettings(item.overrideSettings);

        let outputFormat: string | null = null;
        const originalExtension =
          item.inputPath.split(".").pop()?.toLowerCase() || "";

        if (item.mediaType === "video") {
          outputFormat = mergedSettings.videoFormat ?? originalExtension;
        } else if (item.mediaType === "image") {
          const normalizedExt =
            originalExtension === "jpeg" ? "jpg" : originalExtension;
          outputFormat = mergedSettings.imageFormat ?? normalizedExt;
        } else if (item.mediaType === "audio") {
          outputFormat = mergedSettings.audioFormat ?? originalExtension;
        }

        if (!outputFormat) {
          outputFormat = getDefaultOutputFormat(item.mediaType);
        }

        const request = {
          id: itemId,
          input_path: item.inputPath,
          output_format: outputFormat,
          quality_percent: mergedSettings.qualityPercent,
          strip_metadata: mergedSettings.stripMetadata,
          is_muted: mergedSettings.isMuted,
          resize_config: mergedSettings.resizeEnabled
            ? {
                width: mergedSettings.resizeWidth,
                height: mergedSettings.resizeHeight,
                mode: mergedSettings.resizeMode,
                background_color: mergedSettings.backgroundColor,
              }
            : null,
          naming_config: {
            blocks: mergedSettings.namingConfig.blocks.map((block) => {
              switch (block.type) {
                case "original":
                  return { type: "original" };
                case "prefix":
                  return {
                    type: "prefix",
                    value: block.params?.value || "file",
                  };
                case "random":
                  return {
                    type: "random",
                    length: block.params?.length || DEFAULT_RANDOM_LENGTH,
                  };
                case "date":
                  return { type: "date" };
                default:
                  return { type: "original" };
              }
            }),
            sanitize_enabled: mergedSettings.namingConfig.sanitizeEnabled,
          },
          output_directory: mergedSettings.outputDirectory || null,
          conflict_mode: useAppSettingsStore.getState().conflictMode || "skip",
          processing_enabled: mergedSettings.processingEnabled ?? true,
          max_bitrate: mergedSettings.maxBitrate || null,
        };

        const result = await invoke<ConversionResult>(
          TAURI_COMMANDS.CONVERT_FILE,
          { request },
        );

        if (result.success && result.outputPath) {
          setOutputPath(itemId, result.outputPath);
          updateStatus(itemId, "completed");
          finalStatus = "completed";
        } else {
          updateStatus(itemId, "error", result.errorMessage || "Unknown error");
          finalStatus = "error";
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("Conversion cancelled")) {
          updateStatus(itemId, "cancelled", "Cancelled by user");
          finalStatus = "cancelled";
        } else {
          updateStatus(itemId, "error", message);
          finalStatus = "error";
        }
      } finally {
        currentItemRef.current = null;
      }
      return finalStatus;
    },
    [getMergedSettings, updateStatus, setOutputPath],
  );

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    while (processingRef.current) {
      const nextItem = getNextPendingItem();
      if (!nextItem) {
        break;
      }
      await processItem(nextItem.id);
    }

    processingRef.current = false;
    setIsProcessing(false);

    const currentItems = useQueueStore.getState().items;
    const stats = computeQueueStats(currentItems);
    showCompletionToasts(stats);
  }, [getNextPendingItem, processItem, setIsProcessing, showCompletionToasts]);

  const startProcessing = useCallback(
    (retryErrors: boolean = true) => {
      if (!isProcessing) {
        useQueueStore.getState().resumeQueue(retryErrors);
        processQueue();
      }
    },
    [isProcessing, processQueue],
  );

  const stopProcessing = useCallback(() => {
    processingRef.current = false;
    if (currentItemRef.current) {
      invoke(TAURI_COMMANDS.CANCEL_CONVERSION, {
        id: currentItemRef.current,
      }).catch(console.error);
    }
  }, []);

  const processSelectedItems = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    const selectedItems = getSelectedItems().filter(
      (i) =>
        i.status === "pending" ||
        i.status === "cancelled" ||
        i.status === "error",
    );

    for (const item of selectedItems) {
      if (!processingRef.current) break;

      await processItem(item.id);
    }

    processingRef.current = false;
    setIsProcessing(false);

    const currentItems2 = useQueueStore.getState().items;
    const stats2 = computeQueueStats(currentItems2);
    showCompletionToasts(stats2);
  }, [getSelectedItems, processItem, setIsProcessing, showCompletionToasts]);

  useEffect(() => {
    const unlistenFns: UnlistenFn[] = [];

    listen<ProgressEvent>("conversion-progress", (event) => {
      const { id, progress, status, message } = event.payload;
      updateProgress(id, progress);
      if (status === "error" || status === "cancelled") {
        updateStatus(id, status, message);
      }
    }).then((unlisten) => unlistenFns.push(unlisten));

    listen<ConversionResult>("conversion-complete", (event) => {
      const { id, success, outputPath, errorMessage } = event.payload;
      if (success && outputPath) {
        setOutputPath(id, outputPath);
        updateStatus(id, "completed");
      } else {
        updateStatus(id, "error", errorMessage);
      }
    }).then((unlisten) => unlistenFns.push(unlisten));

    return () => {
      unlistenFns.forEach((fn) => fn());
    };
  }, [updateProgress, updateStatus, setOutputPath]);

  return {
    startProcessing,
    stopProcessing,
    processSelectedItems,
    isProcessing,
  };
}

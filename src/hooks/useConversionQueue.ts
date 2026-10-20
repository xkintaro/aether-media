import { buildConversionRequest } from "@/lib/conversion/buildRequest";
import { useConversionEvents } from "./conversion/useConversionEvents";
import { useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TAURI_COMMANDS } from "@/lib/constants";
import { computeQueueStats } from "@/lib/utils";
import { useQueueStore } from "@/store/queueStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useAppSettingsStore } from "@/store/appSettingsStore";
import { useToastStore } from "@/store/toastStore";
import type { ConversionSettings, ConversionResult, ItemStatus } from "@/types";

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

        const request = buildConversionRequest(
          item,
          mergedSettings,
          useAppSettingsStore.getState().conflictMode,
        );

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

  useConversionEvents();

  return {
    startProcessing,
    stopProcessing,
    processSelectedItems,
    isProcessing,
  };
}

import type { QueueState, QueueSet, QueueGet } from "./types";

export function createProcessingActions(
  set: QueueSet,
  get: QueueGet,
): Pick<
  QueueState,
  | "updateProgress"
  | "updateStatus"
  | "setOutputPath"
  | "setIsProcessing"
  | "getNextPendingItem"
  | "resetQueueStatus"
  | "resumeQueue"
  | "retryCompleted"
> {
  return {
    updateProgress: (id, progress) => {
      set((state) => {
        const idx = state.itemIndex.get(id);
        if (idx !== undefined) state.items[idx].progress = progress;
      });
    },

    updateStatus: (id, status, message) => {
      set((state) => {
        const idx = state.itemIndex.get(id);
        if (idx !== undefined) {
          const item = state.items[idx];
          item.status = status;
          item.errorMessage = message;
          if (status === "completed") item.progress = 100;
        }
      });
    },

    setOutputPath: (id, outputPath) => {
      set((state) => {
        const idx = state.itemIndex.get(id);
        if (idx !== undefined) state.items[idx].outputPath = outputPath;
      });
    },

    setIsProcessing: (value) => {
      set((state) => {
        state.isProcessing = value;
      });
    },

    getNextPendingItem: () => {
      return get().items.find((item) => item.status === "pending");
    },

    resetQueueStatus: () => {
      set((state) => {
        for (const item of state.items) {
          if (item.status === "cancelled" || item.status === "error") {
            item.status = "pending";
            item.progress = 0;
            item.errorMessage = undefined;
          }
        }
      });
    },

    resumeQueue: (retryErrors: boolean) => {
      set((state) => {
        for (const item of state.items) {
          if (
            item.status === "cancelled" ||
            (retryErrors && item.status === "error")
          ) {
            item.status = "pending";
            item.progress = 0;
            item.errorMessage = undefined;
          }
        }
      });
    },

    retryCompleted: () => {
      set((state) => {
        for (const item of state.items) {
          if (item.status === "completed") {
            item.status = "pending";
            item.progress = 0;
            item.errorMessage = undefined;
          }
        }
      });
    },
  };
}

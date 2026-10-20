import type { QueueItem, ProcessStatus } from "@/types";
import { generateId } from "@/lib/utils";
import { rebuildIndex } from "./itemIndex";
import type { QueueState, QueueSet, QueueGet } from "./types";

export function createItemActions(
  set: QueueSet,
  get: QueueGet,
): Pick<QueueState, "addFiles" | "removeItems" | "clearQueue"> {
  return {
    addFiles: (files) => {
      const state = get();
      const existingPaths = new Set(state.items.map((i) => i.inputPath));
      const uniqueFiles = files.filter((f) => !existingPaths.has(f.path));
      const skipped = files.length - uniqueFiles.length;

      if (uniqueFiles.length === 0) {
        return { added: 0, skipped, newItems: [] };
      }

      const newItems: QueueItem[] = uniqueFiles.map((file) => ({
        id: generateId(),
        inputPath: file.path,
        fileName: file.name,
        fileSize: file.size,
        mediaType: file.mediaType,
        thumbnailStatus: "pending" as const,
        status: "pending" as ProcessStatus,
        progress: 0,
        createdAt: Date.now(),
      }));

      set((state) => {
        for (const item of newItems) {
          state.itemIndex.set(item.id, state.items.length);
          state.items.push(item);
        }
      });
      return { added: uniqueFiles.length, skipped, newItems };
    },

    removeItems: (ids) => {
      const { isProcessing } = get();
      if (isProcessing) return;
      const idsSet = new Set(ids);
      set((state) => {
        state.items = state.items.filter((item) => !idsSet.has(item.id));
        state.itemIndex = rebuildIndex(state.items as QueueItem[]);
        for (const id of ids) {
          state.selectedIds.delete(id);
        }
        if (state.expandedId && idsSet.has(state.expandedId)) {
          state.expandedId = null;
        }
      });
    },

    clearQueue: () => {
      const { isProcessing } = get();
      if (isProcessing) return;
      set((state) => {
        state.items = [];
        state.itemIndex = new Map();
        state.selectedIds = new Set();
        state.expandedId = null;
      });
    },
  };
}

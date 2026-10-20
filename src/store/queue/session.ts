import { invoke } from "@tauri-apps/api/core";
import { TAURI_COMMANDS } from "@/lib/constants";
import type { QueueState, QueueSet } from "./types";

export function createSessionActions(
  set: QueueSet,
): Pick<QueueState, "confirmSessionRestore" | "discardSession"> {
  return {
    confirmSessionRestore: () => {
      set((state) => {
        state.sessionRestoreHandled = true;
        state.hasPersistedQueue = false;
      });
    },

    discardSession: async () => {
      try {
        await invoke(TAURI_COMMANDS.CLEANUP_ALL_TEMP_THUMBNAILS);
      } catch (e) {
        console.error("Failed to cleanup all thumbnails:", e);
      }
      set((state) => {
        state.items = [];
        state.itemIndex = new Map();
        state.selectedIds = new Set();
        state.expandedId = null;
        state.hasPersistedQueue = false;
        state.sessionRestoreHandled = true;
      });
    },
  };
}

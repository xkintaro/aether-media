import type { PersistOptions } from "zustand/middleware";
import type { QueueItem } from "@/types";
import type { QueueState } from "./types";
import { rebuildIndex } from "./itemIndex";

export const queuePersistence: PersistOptions<
  QueueState,
  { items: QueueItem[] }
> = {
  name: "aether-media-queue",
  partialize: (state) => ({
    items: state.items as QueueItem[],
  }),
  storage: {
    getItem: (name) => {
      const str = localStorage.getItem(name);
      if (!str) return null;
      const data = JSON.parse(str);

      if (data.state) {
        data.state.selectedIds = new Set();
        data.state.itemIndex = rebuildIndex(data.state.items || []);
        if (data.state.items && data.state.items.length > 0) {
          data.state.hasPersistedQueue = true;
          data.state.sessionRestoreHandled = false;
        }
      }
      return data;
    },
    setItem: (name, value) => {
      localStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: (name) => localStorage.removeItem(name),
  },
};

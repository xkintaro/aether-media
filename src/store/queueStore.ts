import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import type { QueueState } from "./queue/types";
import { queuePersistence } from "./queue/persistence";
import { createItemActions } from "./queue/items";
import { createSelectionActions } from "./queue/selection";
import { createProcessingActions } from "./queue/processing";
import { createThumbnailActions } from "./queue/thumbnails";
import { createOverrideActions } from "./queue/overrides";
import { createSessionActions } from "./queue/session";

enableMapSet();

export const useQueueStore = create<QueueState>()(
  persist(
    immer((set, get) => ({
      items: [],
      itemIndex: new Map(),
      selectedIds: new Set(),
      expandedId: null,
      isProcessing: false,
      lastClickedId: null,
      hasPersistedQueue: false,
      sessionRestoreHandled: false,
      ...createItemActions(set, get),
      ...createSelectionActions(set, get),
      ...createProcessingActions(set, get),
      ...createThumbnailActions(set, get),
      ...createOverrideActions(set),
      ...createSessionActions(set),
    })),
    queuePersistence,
  ),
);

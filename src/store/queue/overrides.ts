import type { QueueState, QueueSet } from "./types";

export function createOverrideActions(
  set: QueueSet,
): Pick<
  QueueState,
  | "updateOverrides"
  | "updateItemOverride"
  | "clearOverrides"
  | "clearAllOverrides"
> {
  return {
    updateOverrides: (id, overrides) => {
      set((state) => {
        const idx = state.itemIndex.get(id);
        if (idx !== undefined) {
          state.items[idx].overrideSettings = {
            ...state.items[idx].overrideSettings,
            ...overrides,
          };
        }
      });
    },

    updateItemOverride: (id, overrides) => {
      set((state) => {
        const idx = state.itemIndex.get(id);
        if (idx !== undefined) {
          if (overrides === null) {
            state.items[idx].overrideSettings = undefined;
          } else {
            state.items[idx].overrideSettings = {
              ...state.items[idx].overrideSettings,
              ...overrides,
            };
          }
        }
      });
    },

    clearOverrides: (id) => {
      set((state) => {
        const idx = state.itemIndex.get(id);
        if (idx !== undefined) state.items[idx].overrideSettings = undefined;
      });
    },

    clearAllOverrides: () => {
      set((state) => {
        for (const item of state.items) {
          item.overrideSettings = undefined;
        }
      });
    },
  };
}

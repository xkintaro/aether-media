import type { QueueState, QueueSet, QueueGet } from "./types";

export function createSelectionActions(
  set: QueueSet,
  get: QueueGet,
): Pick<
  QueueState,
  | "selectItem"
  | "selectAll"
  | "deselectAll"
  | "toggleSelection"
  | "setExpandedId"
  | "selectRange"
  | "getSelectedItems"
> {
  return {
    selectItem: (id, multi = false) => {
      set((state) => {
        if (multi) {
          if (state.selectedIds.has(id)) {
            state.selectedIds.delete(id);
          } else {
            state.selectedIds.add(id);
          }
        } else {
          state.selectedIds = new Set([id]);
        }
      });
    },

    selectAll: () => {
      set((state) => {
        state.selectedIds = new Set(state.items.map((item) => item.id));
      });
    },

    deselectAll: () => {
      set((state) => {
        state.selectedIds = new Set();
      });
    },

    toggleSelection: (id) => {
      set((state) => {
        if (state.selectedIds.has(id)) {
          state.selectedIds.delete(id);
        } else {
          state.selectedIds.add(id);
        }
      });
    },

    setExpandedId: (id) => {
      set((state) => {
        state.expandedId = id;
      });
    },

    selectRange: (fromId, toId) => {
      set((state) => {
        const fromIndex = state.items.findIndex((i) => i.id === fromId);
        const toIndex = state.items.findIndex((i) => i.id === toId);
        if (fromIndex === -1 || toIndex === -1) return state;

        const start = Math.min(fromIndex, toIndex);
        const end = Math.max(fromIndex, toIndex);
        const rangeIds = state.items.slice(start, end + 1).map((i) => i.id);

        for (const id of rangeIds) {
          state.selectedIds.add(id);
        }
        state.lastClickedId = toId;
      });
    },

    getSelectedItems: () => {
      const { items, selectedIds } = get();
      return items.filter((item) => selectedIds.has(item.id));
    },
  };
}

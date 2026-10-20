import { invoke } from "@tauri-apps/api/core";
import { CHUNK_SIZE, TAURI_COMMANDS } from "@/lib/constants";
import type { QueueState, QueueSet, QueueGet } from "./types";

export function createThumbnailActions(
  set: QueueSet,
  get: QueueGet,
): Pick<
  QueueState,
  | "setThumbnail"
  | "setThumbnailLoading"
  | "setThumbnailError"
  | "validateThumbnails"
> {
  return {
    setThumbnail: (id, thumbnailPath) => {
      set((state) => {
        const idx = state.itemIndex.get(id);
        if (idx !== undefined) {
          state.items[idx].thumbnailPath = thumbnailPath;
          state.items[idx].thumbnailStatus = "loaded";
        }
      });
    },

    setThumbnailLoading: (id) => {
      set((state) => {
        const idx = state.itemIndex.get(id);
        if (
          idx !== undefined &&
          state.items[idx].thumbnailStatus === "pending"
        ) {
          state.items[idx].thumbnailStatus = "loading";
        }
      });
    },

    setThumbnailError: (id) => {
      set((state) => {
        const idx = state.itemIndex.get(id);
        if (idx !== undefined) state.items[idx].thumbnailStatus = "error";
      });
    },

    validateThumbnails: async () => {
      const { items } = get();
      const itemsWithThumbnails = items.filter(
        (i) => i.thumbnailPath && i.thumbnailStatus === "loaded",
      );

      if (itemsWithThumbnails.length === 0) return;

      const thumbnailPaths = itemsWithThumbnails.map((i) => i.thumbnailPath!);

      for (let i = 0; i < thumbnailPaths.length; i += CHUNK_SIZE) {
        const chunk = thumbnailPaths.slice(i, i + CHUNK_SIZE);
        try {
          const results = await invoke<
            { path: string; error: string | null }[]
          >(TAURI_COMMANDS.GET_FILES_INFO_BATCH, { paths: chunk });

          const missingPaths = new Set(
            results.filter((r) => r.error !== null).map((r) => r.path),
          );

          if (missingPaths.size > 0) {
            set((state) => {
              for (const item of state.items) {
                if (
                  item.thumbnailPath &&
                  missingPaths.has(item.thumbnailPath)
                ) {
                  item.thumbnailStatus = "error";
                }
              }
            });
          }
        } catch (e) {
          console.error("Failed to validate thumbnails batch:", e);
        }
      }
    },
  };
}

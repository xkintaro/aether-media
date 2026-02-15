import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
enableMapSet();
import { invoke } from "@tauri-apps/api/core";
import type {
  QueueItem,
  ProcessStatus,
  ConversionSettings,
  MediaType,
} from "@/types";
import { generateId } from "@/lib/utils";
import { CHUNK_SIZE, TAURI_COMMANDS } from "@/lib/constants";

interface QueueState {
  items: QueueItem[];
  selectedIds: Set<string>;
  expandedId: string | null;
  isProcessing: boolean;
  lastClickedId: string | null;
  hasPersistedQueue: boolean;
  sessionRestoreHandled: boolean;

  addFiles: (files: FileInput[]) => {
    added: number;
    skipped: number;
    newItems: QueueItem[];
  };
  removeItems: (ids: string[]) => void;
  clearQueue: () => void;
  selectItem: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelection: (id: string) => void;
  selectRange: (fromId: string, toId: string) => void;
  setExpandedId: (id: string | null) => void;

  updateProgress: (id: string, progress: number) => void;
  updateStatus: (id: string, status: ProcessStatus, message?: string) => void;
  setOutputPath: (id: string, outputPath: string) => void;

  setThumbnail: (id: string, thumbnailPath: string) => void;
  setThumbnailLoading: (id: string) => void;
  setThumbnailError: (id: string) => void;

  updateOverrides: (id: string, overrides: Partial<ConversionSettings>) => void;
  updateItemOverride: (
    id: string,
    overrides: Partial<ConversionSettings> | null,
  ) => void;
  clearOverrides: (id: string) => void;
  clearAllOverrides: () => void;

  setIsProcessing: (value: boolean) => void;
  getNextPendingItem: () => QueueItem | undefined;
  getSelectedItems: () => QueueItem[];
  resetQueueStatus: () => void;
  resumeQueue: (retryErrors: boolean) => void;
  retryCompleted: () => void;

  confirmSessionRestore: () => void;
  discardSession: () => Promise<void>;
  validateThumbnails: () => Promise<void>;
}

interface FileInput {
  path: string;
  name: string;
  size: number;
  mediaType: MediaType;
}

export const useQueueStore = create<QueueState>()(
  persist(
    immer((set, get) => ({
      items: [],
      selectedIds: new Set(),
      expandedId: null,
      isProcessing: false,
      lastClickedId: null,
      hasPersistedQueue: false,
      sessionRestoreHandled: false,

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
          state.items.push(...newItems);
        });
        return { added: uniqueFiles.length, skipped, newItems };
      },

      removeItems: (ids) => {
        const { isProcessing } = get();
        if (isProcessing) return;
        const idsSet = new Set(ids);
        set((state) => {
          state.items = state.items.filter((item) => !idsSet.has(item.id));
          state.selectedIds = new Set(
            [...state.selectedIds].filter((id) => !idsSet.has(id)),
          );
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
          state.selectedIds = new Set();
          state.expandedId = null;
        });
      },

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

      updateProgress: (id, progress) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (item) item.progress = progress;
        });
      },

      updateStatus: (id, status, message) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (item) {
            item.status = status;
            item.errorMessage = message;
            if (status === "completed") item.progress = 100;
          }
        });
      },

      setOutputPath: (id, outputPath) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (item) item.outputPath = outputPath;
        });
      },

      setThumbnail: (id, thumbnailPath) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (item) {
            item.thumbnailPath = thumbnailPath;
            item.thumbnailStatus = "loaded";
          }
        });
      },

      setThumbnailLoading: (id) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (item && item.thumbnailStatus === "pending") {
            item.thumbnailStatus = "loading";
          }
        });
      },

      setThumbnailError: (id) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (item) item.thumbnailStatus = "error";
        });
      },

      updateOverrides: (id, overrides) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (item) {
            item.overrideSettings = { ...item.overrideSettings, ...overrides };
          }
        });
      },

      updateItemOverride: (id, overrides) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (item) {
            if (overrides === null) {
              item.overrideSettings = undefined;
            } else {
              item.overrideSettings = {
                ...item.overrideSettings,
                ...overrides,
              };
            }
          }
        });
      },

      clearOverrides: (id) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (item) item.overrideSettings = undefined;
        });
      },

      clearAllOverrides: () => {
        set((state) => {
          for (const item of state.items) {
            item.overrideSettings = undefined;
          }
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

      setIsProcessing: (value) => {
        set((state) => {
          state.isProcessing = value;
        });
      },

      getNextPendingItem: () => {
        return get().items.find((item) => item.status === "pending");
      },

      getSelectedItems: () => {
        const { items, selectedIds } = get();
        return items.filter((item) => selectedIds.has(item.id));
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
          state.selectedIds = new Set();
          state.expandedId = null;
          state.hasPersistedQueue = false;
          state.sessionRestoreHandled = true;
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

            if (i + CHUNK_SIZE < thumbnailPaths.length) {
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          } catch (e) {
            console.error("Failed to validate thumbnails batch:", e);
          }
        }
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
    })),
    {
      name: "aether-media-queue",
      partialize: (state) => ({
        items: state.items,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);

          if (data.state) {
            data.state.selectedIds = new Set();
            if (data.state.items && data.state.items.length > 0) {
              data.state.hasPersistedQueue = true;
              data.state.sessionRestoreHandled = false;
            }
          }
          return data;
        },
        setItem: (name, value) => {
          const serializable = {
            ...value,
            state: {
              ...value.state,
              selectedIds: [],
            },
          };
          localStorage.setItem(name, JSON.stringify(serializable));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);

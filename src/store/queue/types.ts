import type { Draft } from "immer";
import type {
  QueueItem,
  ProcessStatus,
  ConversionSettings,
  MediaType,
} from "@/types";

export interface QueueState {
  items: QueueItem[];
  itemIndex: Map<string, number>;
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

export interface FileInput {
  path: string;
  name: string;
  size: number;
  mediaType: MediaType;
}

export type QueueSet = (recipe: (state: Draft<QueueState>) => void) => void;
export type QueueGet = () => QueueState;

import { create } from "zustand";

interface UploadState {
  isUploading: boolean;
  isComplete: boolean;
  totalFiles: number;
  processedFiles: number;
  abortController: AbortController | null;
  startUpload: (total: number) => AbortController;
  updateProcessedCount: (count: number) => void;
  cancelUpload: () => void;
  finishUpload: () => void;
  dismiss: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  isUploading: false,
  isComplete: false,
  totalFiles: 0,
  processedFiles: 0,
  abortController: null,

  startUpload: (total) => {
    const controller = new AbortController();
    set({
      isUploading: true,
      isComplete: false,
      totalFiles: total,
      processedFiles: 0,
      abortController: controller,
    });
    return controller;
  },

  updateProcessedCount: (count) => {
    set({ processedFiles: count });
  },

  cancelUpload: () => {
    const state = get();
    if (state.abortController) {
      state.abortController.abort();
    }
    set({
      isUploading: false,
      isComplete: false,
      abortController: null,
    });
  },

  finishUpload: () => {
    set({
      isComplete: true,
      abortController: null,
    });
  },

  dismiss: () => {
    set({
      isUploading: false,
      isComplete: false,
    });
  },
}));

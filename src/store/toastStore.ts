import { create } from "zustand";
import { generateId } from "@/lib/utils";
import { TOAST_DEFAULT_DURATION } from "@/lib/constants";

export type ToastType = "info" | "warning" | "error" | "success";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = "info", duration = TOAST_DEFAULT_DURATION) => {
    const id = generateId("toast");
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clearAllToasts: () => {
    set({ toasts: [] });
  },
}));

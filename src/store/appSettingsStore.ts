import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConflictMode } from "@/types";

interface AppSettingsState {
  autoRestoreSession: boolean;
  conflictMode: ConflictMode;
  setAutoRestoreSession: (value: boolean) => void;
  setConflictMode: (value: ConflictMode) => void;
}

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      autoRestoreSession: false,
      conflictMode: "skip",
      setAutoRestoreSession: (value) => {
        set({ autoRestoreSession: value });
      },
      setConflictMode: (value) => {
        set({ conflictMode: value });
      },
    }),
    {
      name: "aether-media-app-settings",
    },
  ),
);

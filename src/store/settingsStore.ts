import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ConversionSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

interface SettingsState {
  settings: ConversionSettings;
  outputDirectory: string | null;

  updateSettings: (updates: Partial<ConversionSettings>) => void;
  resetSettings: () => void;
  setOutputDirectory: (path: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      outputDirectory: null,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },

      setOutputDirectory: (path) => {
        set({ outputDirectory: path });
      },
    }),
    {
      name: "aether-media-settings",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        outputDirectory: state.outputDirectory,
      }),
    },
  ),
);

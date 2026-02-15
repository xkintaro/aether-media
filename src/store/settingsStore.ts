import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ConversionSettings, NamingConfig } from "@/types";
import { DEFAULT_SETTINGS, DEFAULT_RANDOM_LENGTH } from "@/types";

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

      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          const state = persistedState as SettingsState;
          const oldSettings = state.settings as any;

          if (oldSettings.namingConfig) {
            return state;
          }

          const genId = () =>
            `migrated-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

          let blocks: any[] = [];
          let sanitizeEnabled = false;

          switch (oldSettings.namingStrategy) {
            case "original":
              blocks.push({ id: genId(), type: "original" });
              break;
            case "sanitize":
              blocks.push({ id: genId(), type: "original" });
              sanitizeEnabled = true;
              break;
            case "random":
              blocks.push({
                id: genId(),
                type: "random",
                params: { length: DEFAULT_RANDOM_LENGTH },
              });
              break;
            case "date_random":
              blocks.push({ id: genId(), type: "date" });
              blocks.push({
                id: genId(),
                type: "random",
                params: { length: DEFAULT_RANDOM_LENGTH },
              });
              break;
            case "sequential":
              if (oldSettings.namingPrefixEnabled && oldSettings.namingPrefix) {
                blocks.push({
                  id: genId(),
                  type: "prefix",
                  params: { value: oldSettings.namingPrefix },
                });
              }
              blocks.push({ id: genId(), type: "date" });
              break;
            default:
              blocks.push({ id: genId(), type: "original" });
          }

          if (blocks.length === 0) {
            blocks.push({ id: genId(), type: "original" });
          }

          const newNamingConfig: NamingConfig = {
            blocks,
            sanitizeEnabled,
          };

          return {
            ...state,
            settings: {
              ...DEFAULT_SETTINGS,
              ...oldSettings,
              namingConfig: newNamingConfig,
            },
          };
        }
        if (version === 1) {
          const state = persistedState as any;
          const settings = state.settings || {};
          if ("overwrite" in settings) {
            settings.conflictMode = settings.overwrite ? "overwrite" : "skip";
            delete settings.overwrite;
          }
          if (!settings.conflictMode) {
            settings.conflictMode = "skip";
          }
          return { ...state, settings } as SettingsState;
        }
        return persistedState as SettingsState;
      },
      partialize: (state) => ({
        settings: state.settings,
        outputDirectory: state.outputDirectory,
      }),
    },
  ),
);

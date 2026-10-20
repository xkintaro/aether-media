import type { ConversionSettings } from "@/types";

export interface SettingsEditorProps {
  settings: ConversionSettings;
  onSettingsChange: (updates: Partial<ConversionSettings>) => void;
}

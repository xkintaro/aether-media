import { Gauge } from "lucide-react";
import type { SettingsEditorProps } from "./types";

export function VideoBitrateSettings({
  settings,
  onSettingsChange,
}: SettingsEditorProps) {
  return (
    <div key="max-bitrate" className="space-y-2">
      <label className="flex items-center justify-between text-xs font-medium text-smoke">
        <span className="flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5 text-ember-orange" />
          Max Bitrate (kbps)
        </span>
        <span className="font-mono text-ash text-[10px]">
          {settings.maxBitrate ? `${settings.maxBitrate} kbps` : "Auto"}
        </span>
      </label>
      <input
        type="number"
        min={100}
        max={100000}
        step={100}
        placeholder="Auto"
        value={settings.maxBitrate ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onSettingsChange({
            maxBitrate: val ? parseInt(val) : null,
          });
        }}
        className="w-full px-3 py-1.5 rounded-lg bg-graphite border border-border-subtle text-sm text-snow placeholder:text-ash/50 font-mono focus:outline-none focus:border-neon-cyan/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

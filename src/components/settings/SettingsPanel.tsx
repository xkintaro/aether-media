import {
  Settings,
  Sparkles,
  Shield,
  VolumeX,
  FileOutput,
  Folder,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { FormatSelector } from "./FormatSelector";
import { QualityConfig } from "./QualityConfig";
import { PresetSelector } from "./PresetSelector";
import { ResizeConfig } from "./ResizeConfig";
import { NamingConfig } from "./NamingConfig";
import type { MediaType, ConversionSettings } from "@/types";
import { getQualityConfigForFormat } from "@/types";

interface SettingsPanelProps {
  settings: ConversionSettings;
  onSettingsChange: (updates: Partial<ConversionSettings>) => void;
  mediaType?: MediaType;
  hasVideo?: boolean;
  hasImage?: boolean;
  hasAudio?: boolean;
  mode?: "global" | "local";
  showOutputDir?: boolean;
  outputDirectory?: string | null;
  onSelectOutputDir?: () => void;
  originalVideoFormats?: string[];
  originalImageFormats?: string[];
  originalAudioFormats?: string[];
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  mediaType,
  hasVideo: propsHasVideo,
  hasImage: propsHasImage,
  hasAudio: propsHasAudio,
  mode = "global",
  showOutputDir = false,
  outputDirectory,
  onSelectOutputDir,
  originalVideoFormats = [],
  originalImageFormats = [],
  originalAudioFormats = [],
}: SettingsPanelProps) {
  const hasVideo = propsHasVideo ?? mediaType === "video";
  const hasImage = propsHasImage ?? mediaType === "image";
  const hasAudio = propsHasAudio ?? mediaType === "audio";
  const showResize = hasVideo || hasImage;
  const isProcessingEnabled = settings.processingEnabled ?? true;

  return (
    <div
      className={cn(
        "space-y-4",
        mode === "local" &&
        "p-4 bg-graphite/50 rounded-xl border border-border-subtle",
      )}
    >
      {mode === "local" && (
        <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
          <Settings className="w-4 h-4 text-neon-cyan" />
          <span className="text-sm font-medium text-snow">File Settings</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan">
            Override
          </span>
        </div>
      )}

      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-primary/30 border border-border-subtle">
        <div className="space-y-0.5">
          <label className="text-sm font-medium text-snow flex items-center gap-2">
            <Sparkles
              className={cn(
                "w-4 h-4",
                isProcessingEnabled ? "text-neon-cyan" : "text-ash",
              )}
            />
            Enable Media Processing
          </label>
          <p className="text-[11px] text-ash">
            {isProcessingEnabled
              ? "Convert, resize, and optimize media files"
              : "Rename files only"}
          </p>
        </div>
        <ToggleSwitch
          checked={isProcessingEnabled}
          onChange={(checked) =>
            onSettingsChange({ processingEnabled: checked })
          }
        />
      </div>

      {isProcessingEnabled && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {hasVideo && (
            <div key="video-format" className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-smoke">
                <FileOutput className="w-3.5 h-3.5 text-electric-violet" />
                Video Output Format
              </label>
              <FormatSelector
                value={settings.videoFormat}
                onChange={(format) => {
                  const updates: Partial<ConversionSettings> = { videoFormat: format as any };
                  const qualityConfig = getQualityConfigForFormat(format || "mp4");
                  if (qualityConfig) {
                    updates.videoQuality = qualityConfig.default;
                  }
                  onSettingsChange(updates);
                }}
                mediaType="video"
              />
            </div>
          )}
          {hasImage && (
            <div key="image-format" className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-smoke">
                <FileOutput className="w-3.5 h-3.5 text-plasma-pink" />
                Image Output Format
              </label>
              <FormatSelector
                value={settings.imageFormat}
                onChange={(format) => {
                  const updates: Partial<ConversionSettings> = { imageFormat: format as any };
                  const qualityConfig = getQualityConfigForFormat(format || "jpg");
                  if (qualityConfig) {
                    updates.imageQuality = qualityConfig.default;
                  }
                  onSettingsChange(updates);
                }}
                mediaType="image"
              />
            </div>
          )}
          {hasAudio && (
            <div key="audio-format" className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-smoke">
                <FileOutput className="w-3.5 h-3.5 text-ember-orange" />
                Audio Output Format
              </label>
              <FormatSelector
                value={settings.audioFormat}
                onChange={(format) => {
                  const updates: Partial<ConversionSettings> = { audioFormat: format as any };
                  const qualityConfig = getQualityConfigForFormat(format || "mp3");
                  if (qualityConfig) {
                    updates.audioQuality = qualityConfig.default;
                  }
                  onSettingsChange(updates);
                }}
                mediaType="audio"
              />
            </div>
          )}
          {hasVideo && (() => {
            const isOriginal = !settings.videoFormat;
            const formatsToShow = isOriginal
              ? (originalVideoFormats.length > 0 ? originalVideoFormats : ["mp4"])
              : [settings.videoFormat as string];

            return formatsToShow.map((fmt) => (
              <div key={`video-quality-${fmt}`} className="space-y-2">
                <QualityConfig
                  format={fmt}
                  value={
                    isOriginal ? (settings.dynamicVideoQuality?.[fmt] ?? settings.videoQuality) : settings.videoQuality
                  }
                  onChange={(value) => {
                    if (isOriginal) {
                      onSettingsChange({
                        dynamicVideoQuality: { ...settings.dynamicVideoQuality, [fmt]: value }
                      });
                    } else {
                      onSettingsChange({ videoQuality: value });
                    }
                  }}
                  mediaType="video"
                  accentColorClass="text-electric-violet"
                />
              </div>
            ));
          })()}
          {hasVideo &&
            (!settings.videoFormat || ["mp4", "mkv", "mov"].includes(settings.videoFormat)) && (
              <div key="video-preset" className="space-y-2">
                <PresetSelector
                  value={settings.videoPreset as any}
                  onChange={(preset) =>
                    onSettingsChange({ videoPreset: preset })
                  }
                  accentColorClass="text-electric-violet"
                />
              </div>
            )}
          {hasImage && (() => {
            const isOriginal = !settings.imageFormat;
            const formatsToShow = isOriginal
              ? (originalImageFormats.length > 0 ? originalImageFormats : ["jpg"])
              : [settings.imageFormat as string];

            return formatsToShow.map((fmt) => (
              <div key={`image-quality-${fmt}`} className="space-y-2">
                <QualityConfig
                  format={fmt}
                  value={
                    isOriginal ? (settings.dynamicImageQuality?.[fmt] ?? settings.imageQuality) : settings.imageQuality
                  }
                  onChange={(value) => {
                    if (isOriginal) {
                      onSettingsChange({
                        dynamicImageQuality: { ...settings.dynamicImageQuality, [fmt]: value }
                      });
                    } else {
                      onSettingsChange({ imageQuality: value });
                    }
                  }}
                  mediaType="image"
                  accentColorClass="text-plasma-pink"
                />
              </div>
            ));
          })()}
          {hasAudio && (() => {
            const isOriginal = !settings.audioFormat;
            const formatsToShow = isOriginal
              ? (originalAudioFormats.length > 0 ? originalAudioFormats : ["mp3"])
              : [settings.audioFormat as string];

            return formatsToShow.map((fmt) => (
              <div key={`audio-quality-${fmt}`} className="space-y-2">
                <QualityConfig
                  format={fmt}
                  value={
                    isOriginal ? (settings.dynamicAudioQuality?.[fmt] ?? settings.audioQuality) : settings.audioQuality
                  }
                  onChange={(value) => {
                    if (isOriginal) {
                      onSettingsChange({
                        dynamicAudioQuality: { ...settings.dynamicAudioQuality, [fmt]: value }
                      });
                    } else {
                      onSettingsChange({ audioQuality: value });
                    }
                  }}
                  mediaType="audio"
                  accentColorClass="text-ember-orange"
                />
              </div>
            ));
          })()}
          {hasVideo && (
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
          )}
          {showResize && (
            <div key="resize-config">
              <ResizeConfig
                enabled={settings.resizeEnabled}
                onEnabledChange={(enabled) =>
                  onSettingsChange({ resizeEnabled: enabled })
                }
                width={settings.resizeWidth}
                height={settings.resizeHeight}
                onDimensionsChange={(w, h) =>
                  onSettingsChange({ resizeWidth: w, resizeHeight: h })
                }
                mode={settings.resizeMode}
                onModeChange={(mode) => onSettingsChange({ resizeMode: mode })}
                backgroundColor={settings.backgroundColor}
                onBackgroundChange={(color) =>
                  onSettingsChange({ backgroundColor: color })
                }
              />
            </div>
          )}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="flex items-center gap-2 text-xs font-medium text-smoke">
                <Shield className="w-3.5 h-3.5 text-success-green" />
                Remove Metadata
              </span>
              <ToggleSwitch
                checked={settings.stripMetadata}
                onChange={(checked) =>
                  onSettingsChange({ stripMetadata: checked })
                }
              />
            </label>
            {hasVideo && (
              <label
                key="mute-audio"
                className="flex items-center justify-between cursor-pointer group"
              >
                <span className="flex items-center gap-2 text-xs font-medium text-smoke">
                  <VolumeX className="w-3.5 h-3.5 text-warning-amber" />
                  Mute Audio
                </span>
                <ToggleSwitch
                  checked={settings.isMuted}
                  onChange={(checked) => onSettingsChange({ isMuted: checked })}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {showOutputDir && onSelectOutputDir && (
        <div className="space-y-2 pt-4 border-t border-border-subtle">
          <label className="flex items-center gap-2 text-xs font-medium text-smoke">
            <Folder className="w-3.5 h-3.5 text-neon-cyan" />
            Output Directory
          </label>
          <button
            onClick={onSelectOutputDir}
            className="w-full px-3 py-2 rounded-lg bg-graphite border border-border-subtle text-left text-sm text-smoke hover:border-zinc transition-colors group flex items-center justify-between"
          >
            <span className="truncate text-sm">
              {outputDirectory || "Source directory"}
            </span>
          </button>
        </div>
      )}

      {mode === "global" && (
        <div className="pt-4 border-t border-border-subtle">
          <NamingConfig
            config={settings.namingConfig}
            onChange={(namingConfig) => onSettingsChange({ namingConfig })}
          />
        </div>
      )}
    </div>
  );
}

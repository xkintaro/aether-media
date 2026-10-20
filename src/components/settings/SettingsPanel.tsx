import { OutputFormats } from "./processing/OutputFormats";
import {
  VideoQualitySettings,
  ImageQualitySettings,
  AudioQualitySettings,
} from "./processing/MediaQualitySettings";
import { VideoBitrateSettings } from "./processing/VideoBitrateSettings";
import { Settings, Sparkles, Shield, VolumeX, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { PresetSelector } from "./PresetSelector";
import { ResizeConfig } from "./ResizeConfig";
import { NamingConfig } from "./NamingConfig";
import type { MediaType, ConversionSettings } from "@/types";

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
          <OutputFormats
            settings={settings}
            onSettingsChange={onSettingsChange}
            hasVideo={hasVideo}
            hasImage={hasImage}
            hasAudio={hasAudio}
          />
          {hasVideo && (
            <VideoQualitySettings
              settings={settings}
              onSettingsChange={onSettingsChange}
              originalVideoFormats={originalVideoFormats}
            />
          )}
          {hasVideo &&
            (!settings.videoFormat ||
              ["mp4", "mkv", "mov"].includes(settings.videoFormat)) && (
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
          {hasImage && (
            <ImageQualitySettings
              settings={settings}
              onSettingsChange={onSettingsChange}
              originalImageFormats={originalImageFormats}
            />
          )}
          {hasAudio && (
            <AudioQualitySettings
              settings={settings}
              onSettingsChange={onSettingsChange}
              originalAudioFormats={originalAudioFormats}
            />
          )}
          {hasVideo && (
            <VideoBitrateSettings
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
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

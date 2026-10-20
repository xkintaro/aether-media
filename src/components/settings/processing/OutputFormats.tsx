import { FileOutput } from "lucide-react";
import type { ConversionSettings } from "@/types";
import { getQualityConfigForFormat } from "@/types";
import { FormatSelector } from "../FormatSelector";
import type { SettingsEditorProps } from "./types";

interface OutputFormatsProps extends SettingsEditorProps {
  hasVideo: boolean;
  hasImage: boolean;
  hasAudio: boolean;
}

export function OutputFormats({
  settings,
  onSettingsChange,
  hasVideo,
  hasImage,
  hasAudio,
}: OutputFormatsProps) {
  return (
    <>
      {hasVideo && (
        <div key="video-format" className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-smoke">
            <FileOutput className="w-3.5 h-3.5 text-electric-violet" />
            Video Output Format
          </label>
          <FormatSelector
            value={settings.videoFormat}
            onChange={(format) => {
              const updates: Partial<ConversionSettings> = {
                videoFormat: format as any,
              };
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
              const updates: Partial<ConversionSettings> = {
                imageFormat: format as any,
              };
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
              const updates: Partial<ConversionSettings> = {
                audioFormat: format as any,
              };
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
    </>
  );
}

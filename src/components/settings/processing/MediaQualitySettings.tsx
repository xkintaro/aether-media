import { QualityConfig } from "../QualityConfig";
import type { SettingsEditorProps } from "./types";

export function VideoQualitySettings({
  settings,
  onSettingsChange,
  originalVideoFormats,
}: SettingsEditorProps & { originalVideoFormats: string[] }) {
  const isOriginal = !settings.videoFormat;
  const formatsToShow = isOriginal
    ? originalVideoFormats.length > 0
      ? originalVideoFormats
      : ["mp4"]
    : [settings.videoFormat as string];

  return formatsToShow.map((fmt) => (
    <div key={`video-quality-${fmt}`} className="space-y-2">
      <QualityConfig
        format={fmt}
        value={
          isOriginal
            ? (settings.dynamicVideoQuality?.[fmt] ?? settings.videoQuality)
            : settings.videoQuality
        }
        onChange={(value) => {
          if (isOriginal) {
            onSettingsChange({
              dynamicVideoQuality: {
                ...settings.dynamicVideoQuality,
                [fmt]: value,
              },
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
}

export function ImageQualitySettings({
  settings,
  onSettingsChange,
  originalImageFormats,
}: SettingsEditorProps & { originalImageFormats: string[] }) {
  const isOriginal = !settings.imageFormat;
  const formatsToShow = isOriginal
    ? originalImageFormats.length > 0
      ? originalImageFormats
      : ["jpg"]
    : [settings.imageFormat as string];

  return formatsToShow.map((fmt) => (
    <div key={`image-quality-${fmt}`} className="space-y-2">
      <QualityConfig
        format={fmt}
        value={
          isOriginal
            ? (settings.dynamicImageQuality?.[fmt] ?? settings.imageQuality)
            : settings.imageQuality
        }
        onChange={(value) => {
          if (isOriginal) {
            onSettingsChange({
              dynamicImageQuality: {
                ...settings.dynamicImageQuality,
                [fmt]: value,
              },
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
}

export function AudioQualitySettings({
  settings,
  onSettingsChange,
  originalAudioFormats,
}: SettingsEditorProps & { originalAudioFormats: string[] }) {
  const isOriginal = !settings.audioFormat;
  const formatsToShow = isOriginal
    ? originalAudioFormats.length > 0
      ? originalAudioFormats
      : ["mp3"]
    : [settings.audioFormat as string];

  return formatsToShow.map((fmt) => (
    <div key={`audio-quality-${fmt}`} className="space-y-2">
      <QualityConfig
        format={fmt}
        value={
          isOriginal
            ? (settings.dynamicAudioQuality?.[fmt] ?? settings.audioQuality)
            : settings.audioQuality
        }
        onChange={(value) => {
          if (isOriginal) {
            onSettingsChange({
              dynamicAudioQuality: {
                ...settings.dynamicAudioQuality,
                [fmt]: value,
              },
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
}

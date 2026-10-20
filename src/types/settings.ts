import type {
  OutputFormat,
  VideoFormat,
  ImageFormat,
  AudioFormat,
} from "./media";
import type { NamingConfig } from "./naming";

export type ResizeMode = "fill" | "cover" | "contain";

export type BackgroundColor = "transparent" | "black" | "white";

export type ConflictMode = "skip" | "overwrite" | "keep_both";

export interface ResizeConfig {
  width: number;
  height: number;
  mode: ResizeMode;
  backgroundColor: BackgroundColor;
}

export interface ConversionSettings {
  outputFormat: OutputFormat | null;
  videoFormat: VideoFormat | null;
  imageFormat: ImageFormat | null;
  audioFormat: AudioFormat | null;
  videoQuality: number;
  imageQuality: number;
  audioQuality: number;
  dynamicVideoQuality: Record<string, number>;
  dynamicImageQuality: Record<string, number>;
  dynamicAudioQuality: Record<string, number>;
  resizeEnabled: boolean;
  resizeWidth: number;
  resizeHeight: number;
  resizeMode: ResizeMode;
  backgroundColor: BackgroundColor;
  isMuted: boolean;
  stripMetadata: boolean;
  namingConfig: NamingConfig;
  outputDirectory?: string;
  conflictMode: ConflictMode;
  processingEnabled: boolean;
  maxBitrate: number | null;
  videoPreset: string;
}

export const DEFAULT_SETTINGS: ConversionSettings = {
  outputFormat: null,
  videoFormat: null,
  imageFormat: null,
  audioFormat: null,
  videoQuality: 23,
  imageQuality: 5,
  audioQuality: 2,
  dynamicVideoQuality: {},
  dynamicImageQuality: {},
  dynamicAudioQuality: {},
  resizeEnabled: false,
  resizeWidth: 1920,
  resizeHeight: 1080,
  resizeMode: "contain",
  backgroundColor: "black",
  isMuted: false,
  stripMetadata: false,
  namingConfig: {
    blocks: [{ id: "default-original", type: "original" }],
    sanitizeEnabled: false,
  },
  conflictMode: "skip",
  processingEnabled: true,
  maxBitrate: null,
  videoPreset: "medium",
};

export type VideoFormat = "mp4" | "mkv" | "mov" | "webm";
export type ImageFormat = "jpg" | "png" | "webp";
export type AudioFormat = "mp3" | "aac" | "m4a" | "ogg";
export type OutputFormat = VideoFormat | ImageFormat | AudioFormat;

export type MediaType = "video" | "image" | "audio";

export type ResizeMode = "fill" | "cover" | "contain";

export type BackgroundColor = "transparent" | "black" | "white";

export type ConflictMode = "skip" | "overwrite" | "keep_both";

export type NamingBlockType = "original" | "prefix" | "random" | "date";

export interface NamingBlock {
  id: string;
  type: NamingBlockType;
  params?: {
    value?: string;
    length?: number;
  };
}

export interface NamingConfig {
  blocks: NamingBlock[];
  sanitizeEnabled: boolean;
}

export type ProcessStatus =
  | "pending"
  | "processing"
  | "completed"
  | "error"
  | "cancelled"
  | "conflict";

export type ItemStatus = "completed" | "error" | "cancelled";

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

export type ThumbnailStatus = "pending" | "loading" | "loaded" | "error";

export interface QueueItem {
  id: string;
  inputPath: string;
  fileName: string;
  fileSize: number;
  mediaType: MediaType;
  thumbnailPath?: string;
  thumbnailStatus: ThumbnailStatus;
  status: ProcessStatus;
  progress: number;
  overrideSettings?: Partial<ConversionSettings>;
  errorMessage?: string;
  outputPath?: string;
  createdAt: number;
}

export interface ProgressEvent {
  id: string;
  progress: number;
  status: ProcessStatus;
  message?: string;
}

export interface ConversionResult {
  id: string;
  success: boolean;
  outputPath?: string;
  errorMessage?: string;
}

export const VIDEO_EXTENSIONS = [
  "mp4",
  "mkv",
  "mov",
  "webm",
  "avi",
  "wmv",
  "flv",
  "m4v",
] as const;

export const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "bmp",
  "tiff",
  "tif",
] as const;

export const AUDIO_EXTENSIONS = [
  "mp3",
  "aac",
  "m4a",
  "ogg",
  "wav",
  "flac",
  "wma",
  "opus",
] as const;

export const ALL_EXTENSIONS = [
  ...VIDEO_EXTENSIONS,
  ...IMAGE_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
] as const;

export const DISPLAY_FORMATS = {
  video: ["MP4", "MKV", "MOV", "WebM"],
  image: ["JPG", "PNG", "WebP"],
  audio: ["MP3", "AAC", "M4A", "OGG"],
} as const;

export const VIDEO_OUTPUT_FORMATS: VideoFormat[] = [
  "mp4",
  "mkv",
  "mov",
  "webm",
];

export const IMAGE_OUTPUT_FORMATS: ImageFormat[] = ["jpg", "png", "webp"];

export const AUDIO_OUTPUT_FORMATS: AudioFormat[] = ["mp3", "aac", "m4a", "ogg"];

export function getMediaType(extension: string): MediaType | null {
  const ext = extension.toLowerCase().replace(".", "");
  if (VIDEO_EXTENSIONS.includes(ext as (typeof VIDEO_EXTENSIONS)[number]))
    return "video";
  if (IMAGE_EXTENSIONS.includes(ext as (typeof IMAGE_EXTENSIONS)[number]))
    return "image";
  if (AUDIO_EXTENSIONS.includes(ext as (typeof AUDIO_EXTENSIONS)[number]))
    return "audio";
  return null;
}

export function getAvailableOutputFormats(
  mediaType: MediaType,
): OutputFormat[] {
  switch (mediaType) {
    case "video":
      return [...VIDEO_OUTPUT_FORMATS, ...AUDIO_OUTPUT_FORMATS];
    case "image":
      return IMAGE_OUTPUT_FORMATS;
    case "audio":
      return AUDIO_OUTPUT_FORMATS;
  }
}

export function getDefaultOutputFormat(mediaType: MediaType): OutputFormat {
  switch (mediaType) {
    case "video":
      return "mp4";
    case "image":
      return "png";
    case "audio":
      return "mp3";
  }
}

export const DEFAULT_RANDOM_LENGTH = 8;

export interface FormatQualityInfo {
  min: number;
  max: number;
  default: number;
  step: number;
  label: string;
  unit: string;
  description: string;
  lowerIsBetter: boolean;
  isLossless?: boolean;
}

export const FORMAT_QUALITY_CONFIG: Record<string, FormatQualityInfo> = {
  // Video
  mp4: { min: 18, max: 51, default: 23, step: 1, label: "CRF", unit: "", description: "Lower = higher quality", lowerIsBetter: true },
  mkv: { min: 18, max: 51, default: 23, step: 1, label: "CRF", unit: "", description: "Lower = higher quality", lowerIsBetter: true },
  mov: { min: 18, max: 51, default: 23, step: 1, label: "CRF", unit: "", description: "Lower = higher quality", lowerIsBetter: true },
  webm: { min: 24, max: 63, default: 31, step: 1, label: "CRF", unit: "", description: "Lower = higher quality", lowerIsBetter: true },
  // Image
  jpg: { min: 2, max: 31, default: 5, step: 1, label: "Quality", unit: "", description: "Lower = higher quality", lowerIsBetter: true },
  webp: { min: 1, max: 100, default: 80, step: 1, label: "Quality", unit: "", description: "Higher = higher quality", lowerIsBetter: false },
  png: { min: 0, max: 0, default: 0, step: 0, label: "Lossless", unit: "", description: "No quality setting needed", lowerIsBetter: false, isLossless: true },
  // Audio
  mp3: { min: 0, max: 9, default: 2, step: 1, label: "VBR Quality", unit: "", description: "Lower = higher quality", lowerIsBetter: true },
  aac: { min: 128, max: 320, default: 192, step: 8, label: "Bitrate", unit: "kbps", description: "Higher = higher quality", lowerIsBetter: false },
  m4a: { min: 128, max: 320, default: 192, step: 8, label: "Bitrate", unit: "kbps", description: "Higher = higher quality", lowerIsBetter: false },
  ogg: { min: 1, max: 8, default: 6, step: 1, label: "Quality", unit: "", description: "Higher = higher quality", lowerIsBetter: false },
};

export function getQualityConfigForFormat(format: string | null): FormatQualityInfo | null {
  if (!format) return null;
  return FORMAT_QUALITY_CONFIG[format.toLowerCase()] || null;
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

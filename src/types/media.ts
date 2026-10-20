export type VideoFormat = "mp4" | "mkv" | "mov" | "webm";
export type ImageFormat = "jpg" | "png" | "webp";
export type AudioFormat = "mp3" | "aac" | "m4a" | "ogg";
export type OutputFormat = VideoFormat | ImageFormat | AudioFormat;

export type MediaType = "video" | "image" | "audio";

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

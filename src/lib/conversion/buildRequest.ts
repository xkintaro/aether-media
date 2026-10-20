import {
  getDefaultOutputFormat,
  DEFAULT_RANDOM_LENGTH,
  getQualityConfigForFormat,
} from "@/types";
import type { QueueItem, ConversionSettings } from "@/types";

export function buildConversionRequest(
  item: QueueItem,
  mergedSettings: ConversionSettings,
  conflictMode: string,
) {
  const itemId = item.id;
  let outputFormat: string | null = null;
  const originalExtension =
    item.inputPath.split(".").pop()?.toLowerCase() || "";

  if (item.mediaType === "video") {
    outputFormat = mergedSettings.videoFormat ?? originalExtension;
  } else if (item.mediaType === "image") {
    const normalizedExt =
      originalExtension === "jpeg" ? "jpg" : originalExtension;
    outputFormat = mergedSettings.imageFormat ?? normalizedExt;
  } else if (item.mediaType === "audio") {
    outputFormat = mergedSettings.audioFormat ?? originalExtension;
  }

  if (!outputFormat) {
    outputFormat = getDefaultOutputFormat(item.mediaType);
  }

  let isOriginalFormat = false;
  if (item.mediaType === "video" && !mergedSettings.videoFormat)
    isOriginalFormat = true;
  if (item.mediaType === "image" && !mergedSettings.imageFormat)
    isOriginalFormat = true;
  if (item.mediaType === "audio" && !mergedSettings.audioFormat)
    isOriginalFormat = true;

  let qualityValue = 23;
  if (item.mediaType === "video") {
    qualityValue = isOriginalFormat
      ? (mergedSettings.dynamicVideoQuality?.[outputFormat] ??
        mergedSettings.videoQuality)
      : mergedSettings.videoQuality;
  } else if (item.mediaType === "image") {
    qualityValue = isOriginalFormat
      ? (mergedSettings.dynamicImageQuality?.[outputFormat] ??
        mergedSettings.imageQuality)
      : mergedSettings.imageQuality;
  } else if (item.mediaType === "audio") {
    qualityValue = isOriginalFormat
      ? (mergedSettings.dynamicAudioQuality?.[outputFormat] ??
        mergedSettings.audioQuality)
      : mergedSettings.audioQuality;
  }

  const qualityConfig = getQualityConfigForFormat(outputFormat);
  if (
    qualityConfig &&
    (qualityValue < qualityConfig.min || qualityValue > qualityConfig.max)
  ) {
    qualityValue = qualityConfig.default;
  }

  const request = {
    id: itemId,
    input_path: item.inputPath,
    output_format: outputFormat,
    quality_value: qualityValue,
    strip_metadata: mergedSettings.stripMetadata,
    is_muted: mergedSettings.isMuted,
    resize_config: mergedSettings.resizeEnabled
      ? {
          width: mergedSettings.resizeWidth,
          height: mergedSettings.resizeHeight,
          mode: mergedSettings.resizeMode,
          background_color: mergedSettings.backgroundColor,
        }
      : null,
    naming_config: {
      blocks: mergedSettings.namingConfig.blocks.map((block) => {
        switch (block.type) {
          case "original":
            return { type: "original" };
          case "prefix":
            return {
              type: "prefix",
              value: block.params?.value || "file",
            };
          case "random":
            return {
              type: "random",
              length: block.params?.length || DEFAULT_RANDOM_LENGTH,
            };
          case "date":
            return { type: "date" };
          default:
            return { type: "original" };
        }
      }),
      sanitize_enabled: mergedSettings.namingConfig.sanitizeEnabled,
    },
    output_directory: mergedSettings.outputDirectory || null,
    conflict_mode: conflictMode || "skip",
    processing_enabled: mergedSettings.processingEnabled ?? true,
    max_bitrate: mergedSettings.maxBitrate || null,
    video_preset:
      item.mediaType === "video" ? mergedSettings.videoPreset : null,
  };

  return request;
}

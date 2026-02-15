import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { MediaType } from "@/types";
import { TAURI_COMMANDS } from "@/lib/constants";

interface ThumbnailResult {
  id: string;
  thumbnailPath: string | null;
  success: boolean;
  errorMessage?: string | null;
}

interface ThumbnailRequest {
  id: string;
  input_path: string;
  media_type: MediaType;
}

export function useThumbnail() {
  const generateThumbnail = useCallback(
    async (id: string, inputPath: string, mediaType: MediaType) => {
      if (mediaType === "audio") {
        return null;
      }

      try {
        const request = {
          id,
          input_path: inputPath,
          media_type: mediaType,
        };

        const result = await invoke<ThumbnailResult>(
          TAURI_COMMANDS.GENERATE_THUMBNAIL,
          { request },
        );

        if (!result.success && result.errorMessage) {
          console.error(
            `Thumbnail generation failed for ${id}:`,
            result.errorMessage,
          );
        }

        return result.success ? result.thumbnailPath : null;
      } catch (error) {
        console.error("Thumbnail generation failed:", error);
        return null;
      }
    },
    [],
  );

  const generateThumbnailsBatch = useCallback(
    async (
      items: Array<{ id: string; inputPath: string; mediaType: MediaType }>,
    ): Promise<Map<string, string>> => {
      const requests: ThumbnailRequest[] = items
        .filter((item) => item.mediaType !== "audio")
        .map((item) => ({
          id: item.id,
          input_path: item.inputPath,
          media_type: item.mediaType,
        }));

      if (requests.length === 0) {
        return new Map();
      }

      try {
        const results = await invoke<ThumbnailResult[]>(
          TAURI_COMMANDS.GENERATE_THUMBNAILS_BATCH,
          { requests },
        );

        const resultMap = new Map<string, string>();
        for (const result of results) {
          if (result.success && result.thumbnailPath) {
            resultMap.set(result.id, result.thumbnailPath);
          } else if (!result.success && result.errorMessage) {
            console.error(
              `Thumbnail generation failed for ${result.id}:`,
              result.errorMessage,
            );
          }
        }
        return resultMap;
      } catch (error) {
        console.error("Batch thumbnail generation failed:", error);
        return new Map();
      }
    },
    [],
  );

  const cleanupThumbnails = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;

    try {
      await invoke(TAURI_COMMANDS.DELETE_THUMBNAILS, { fileIds: ids });
    } catch (error) {
      console.error("Thumbnail cleanup failed:", error);
    }
  }, []);

  return {
    generateThumbnail,
    generateThumbnailsBatch,
    cleanupThumbnails,
  };
}

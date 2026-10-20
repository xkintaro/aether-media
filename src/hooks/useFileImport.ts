import { useCallback, useEffect, useRef, type RefObject } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useQueueStore } from "@/store/queueStore";
import { useToastStore } from "@/store/toastStore";
import { useUploadStore } from "@/store/uploadStore";
import { getMediaType, ALL_EXTENSIONS } from "@/types";
import { getFileName, getExtension } from "@/lib/utils";
import {
  CHUNK_SIZE,
  PROCESS_DEBUG_DELAY,
  TAURI_COMMANDS,
} from "@/lib/constants";

interface FileInfo {
  path: string;
  name: string;
  size: number;
  mediaType: "video" | "image" | "audio";
}

export function useFileImport(isSessionDialogActiveRef: RefObject<boolean>) {
  const { items, addFiles, setThumbnailError, isProcessing } = useQueueStore();
  const { addToast } = useToastStore();
  const { startUpload, updateProcessedCount, finishUpload } = useUploadStore();
  interface RustFileInfo {
    path: string;
    info: {
      path: string;
      name: string;
      size: number;
      mediaType: string;
    } | null;
    error: string | null;
  }

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const handleFilePaths = useCallback(
    async (paths: string[]) => {
      if (paths.length === 0) return;

      const existingPaths = new Set(itemsRef.current.map((i) => i.inputPath));
      const newPaths: string[] = [];
      let existingCount = 0;
      let unsupportedCount = 0;

      for (const path of paths) {
        const ext = getExtension(path);
        const mediaType = getMediaType(ext);
        if (!mediaType) {
          unsupportedCount++;
          continue;
        }
        if (existingPaths.has(path)) {
          existingCount++;
        } else {
          newPaths.push(path);
        }
      }

      const showSkippedSummary = () => {
        if (existingCount > 0)
          addToast(`${existingCount} files already in list`, "warning");
        if (unsupportedCount > 0)
          addToast(`${unsupportedCount} files in unsupported format`, "error");
      };

      if (newPaths.length === 0) {
        showSkippedSummary();
        return;
      }

      const abortController = startUpload(newPaths.length);
      let uploadedCount = 0;
      let processedTotal = 0;

      for (let i = 0; i < newPaths.length; i += CHUNK_SIZE) {
        if (abortController.signal.aborted) break;

        const chunk = newPaths.slice(i, i + CHUNK_SIZE);

        try {
          const results = await invoke<RustFileInfo[]>(
            TAURI_COMMANDS.GET_FILES_INFO_BATCH,
            { paths: chunk },
          );
          const validFiles: FileInfo[] = [];

          for (const result of results) {
            if (abortController.signal.aborted) break;

            if (result.info) {
              validFiles.push({
                path: result.info.path,
                name: result.info.name,
                size: result.info.size,
                mediaType: result.info.mediaType as "video" | "image" | "audio",
              });
            } else {
              const ext = getExtension(result.path);
              const mediaType = getMediaType(ext);
              if (mediaType) {
                validFiles.push({
                  path: result.path,
                  name: getFileName(result.path),
                  size: 0,
                  mediaType,
                });
              }
            }
          }

          if (validFiles.length > 0 && !abortController.signal.aborted) {
            const { newItems } = addFiles(validFiles);

            if (newItems.length > 0) {
              uploadedCount += newItems.length;

              newItems
                .filter((item) => item.mediaType === "audio")
                .forEach((item) => setThumbnailError(item.id));
            }
          }

          processedTotal += chunk.length;
          updateProcessedCount(processedTotal);

          await new Promise((resolve) =>
            setTimeout(resolve, PROCESS_DEBUG_DELAY),
          );
        } catch (error) {
          console.error("Batch error:", error);
          processedTotal += chunk.length;
          updateProcessedCount(processedTotal);
        }
      }

      if (abortController.signal.aborted) {
        const cancelledCount = newPaths.length - uploadedCount;
        if (uploadedCount > 0)
          addToast(`${uploadedCount} files uploaded`, "success");
        if (cancelledCount > 0)
          addToast(`${cancelledCount} files cancelled`, "warning");
        showSkippedSummary();
      } else {
        finishUpload();
        addToast(`${uploadedCount} files added`, "success");
        showSkippedSummary();
      }
    },
    [
      addFiles,
      addToast,
      setThumbnailError,
      startUpload,
      updateProcessedCount,
      finishUpload,
    ],
  );

  const handleAddFiles = useCallback(async () => {
    if (isSessionDialogActiveRef.current || isProcessing) return;

    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "Media",
          extensions: [...ALL_EXTENSIONS],
        },
      ],
    });

    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      handleFilePaths(paths);
    }
  }, [handleFilePaths, isProcessing]);

  return { handleFilePaths, handleAddFiles };
}

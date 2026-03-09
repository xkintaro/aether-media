import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Upload, XCircle } from "lucide-react";

import { ToastContainer } from "@/components/ui/ToastContainer";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { FileTable } from "@/components/file-table/FileTable";
import { UploadOverlay } from "@/components/ui/UploadOverlay";
import { SessionRestoreDialog } from "@/components/ui/SessionRestoreDialog";

import { useQueueStore } from "@/store/queueStore";
import { useToastStore } from "@/store/toastStore";
import { useUploadStore } from "@/store/uploadStore";
import { useAppSettingsStore } from "@/store/appSettingsStore";
import { useSettingsStore } from "@/store/settingsStore";

import { getMediaType, ALL_EXTENSIONS } from "@/types";
import { getFileName, getExtension, cn } from "@/lib/utils";
import { hasEffectiveOverride } from "@/lib/overrideUtils";
import {
  TOOLBAR_HEIGHT,
  CHUNK_SIZE,
  PROCESS_DEBUG_DELAY,
  TAURI_COMMANDS,
  TAURI_EVENTS,
} from "@/lib/constants";

interface TauriDropPayload {
  paths: string[];
}

interface FileInfo {
  path: string;
  name: string;
  size: number;
  mediaType: "video" | "image" | "audio";
}

function App() {
  const {
    items,
    addFiles,
    setThumbnailError,
    hasPersistedQueue,
    sessionRestoreHandled,
    confirmSessionRestore,
    discardSession,
    clearAllOverrides,
    isProcessing,
  } = useQueueStore();

  const { addToast } = useToastStore();
  const { startUpload, updateProcessedCount, finishUpload, isUploading } =
    useUploadStore();
  const { settings } = useSettingsStore();

  const overrideCount = useMemo(
    () =>
      items.filter((i) => hasEffectiveOverride(i.overrideSettings, settings))
        .length,
    [items, settings],
  );
  const [isDragging, setIsDragging] = useState(false);

  const handleSessionRestore = useCallback(() => {
    confirmSessionRestore();
    addToast("Previous session restored", "success");
  }, [confirmSessionRestore, addToast]);

  const handleSessionDiscard = useCallback(async () => {
    await discardSession();
    addToast("Previous session cleared", "info");
  }, [discardSession, addToast]);

  const { autoRestoreSession } = useAppSettingsStore();

  useEffect(() => {
    if (hasPersistedQueue && !sessionRestoreHandled && autoRestoreSession) {
      confirmSessionRestore();
    }
    useQueueStore.getState().validateThumbnails();
  }, [
    hasPersistedQueue,
    sessionRestoreHandled,
    autoRestoreSession,
    confirmSessionRestore,
  ]);

  const showSessionDialog =
    hasPersistedQueue && !sessionRestoreHandled && !autoRestoreSession;
  const isSessionDialogActiveRef = useRef(showSessionDialog);

  useEffect(() => {
    isSessionDialogActiveRef.current = showSessionDialog;
  }, [showSessionDialog]);

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

  const handleFilePathsRef = useRef(handleFilePaths);
  useEffect(() => {
    handleFilePathsRef.current = handleFilePaths;
  }, [handleFilePaths]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  useEffect(() => {
    const unlistenPromises: Promise<() => void>[] = [];

    unlistenPromises.push(
      listen(TAURI_EVENTS.DRAG_ENTER, () => {
        if (
          isSessionDialogActiveRef.current ||
          useQueueStore.getState().isProcessing
        )
          return;
        setIsDragging(true);
      }),
    );

    unlistenPromises.push(
      listen(TAURI_EVENTS.DRAG_LEAVE, () => {
        setIsDragging(false);
      }),
    );

    unlistenPromises.push(
      listen<TauriDropPayload>(TAURI_EVENTS.DRAG_DROP, (event) => {
        setIsDragging(false);
        if (
          isSessionDialogActiveRef.current ||
          useQueueStore.getState().isProcessing
        )
          return;

        if (event.payload.paths?.length > 0) {
          handleFilePathsRef.current(event.payload.paths);
        }
      }),
    );

    return () => {
      unlistenPromises.forEach((p) => p.then((unlisten) => unlisten()));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="h-screen flex flex-col bg-void overflow-hidden noise-overlay relative">
      <ToastContainer />

      <AnimatePresence>
        {showSessionDialog && (
          <SessionRestoreDialog
            onRestore={handleSessionRestore}
            onDiscard={handleSessionDiscard}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{isUploading && <UploadOverlay />}</AnimatePresence>

      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop z-(--z-drag-overlay)"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "flex flex-col items-center gap-4 p-12",
                "rounded-2xl border-2 border-dashed border-neon-cyan",
                "bg-neon-cyan/5",
              )}
            >
              <div>
                <Upload className="w-12 h-12 text-neon-cyan" />
              </div>
              <div className="text-center">
                <p className="text-xl font-display font-semibold text-snow">
                  Drop Files
                </p>
                <p className="text-sm text-ash mt-1">
                  Video, image or audio files
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div
            style={{ height: TOOLBAR_HEIGHT }}
            className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-3 bg-surface-secondary/30"
          >
            <AnimatePresence>
              {overrideCount > 0 && (
                <div>
                  <button
                    onClick={() => {
                      clearAllOverrides();
                      addToast(
                        `Custom settings cleared for ${overrideCount} files`,
                        "info",
                      );
                    }}
                    disabled={isProcessing}
                    className={cn(
                      "btn-ghost text-sm px-5 py-2.5",
                      "text-plasma-pink bg-plasma-pink/10 border-plasma-pink/20",
                      "hover:bg-plasma-pink/20 hover:border-plasma-pink/40 hover:text-plasma-pink",
                      isProcessing && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <XCircle className="w-4 h-4" />
                    Clear Override ({overrideCount})
                  </button>
                </div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-end flex-1">
              <div>
                <button
                  onClick={handleAddFiles}
                  disabled={isProcessing}
                  className={cn(
                    "btn-neon text-sm",
                    isProcessing && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <Plus className="w-4 h-4" />
                  Add Files
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <FileTable />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

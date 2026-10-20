import { useState, useRef, useEffect, type RefObject } from "react";
import { listen } from "@tauri-apps/api/event";
import { useQueueStore } from "@/store/queueStore";
import { TAURI_EVENTS } from "@/lib/constants";

interface TauriDropPayload {
  paths: string[];
}

export function useFileDrop(
  handleFilePaths: (paths: string[]) => Promise<void>,
  isSessionDialogActiveRef: RefObject<boolean>,
) {
  const [isDragging, setIsDragging] = useState(false);
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

  return isDragging;
}

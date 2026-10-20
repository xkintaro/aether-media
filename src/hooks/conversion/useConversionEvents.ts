import { useEffect } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useQueueStore } from "@/store/queueStore";
import type { ProgressEvent, ConversionResult } from "@/types";

export function useConversionEvents() {
  const { updateProgress, updateStatus, setOutputPath } = useQueueStore();
  useEffect(() => {
    const unlistenFns: UnlistenFn[] = [];

    listen<ProgressEvent>("conversion-progress", (event) => {
      const { id, progress, status, message } = event.payload;
      updateProgress(id, progress);
      if (status === "error" || status === "cancelled") {
        updateStatus(id, status, message);
      }
    }).then((unlisten) => unlistenFns.push(unlisten));

    listen<ConversionResult>("conversion-complete", (event) => {
      const { id, success, outputPath, errorMessage } = event.payload;
      if (success && outputPath) {
        setOutputPath(id, outputPath);
        updateStatus(id, "completed");
      } else {
        updateStatus(id, "error", errorMessage);
      }
    }).then((unlisten) => unlistenFns.push(unlisten));

    return () => {
      unlistenFns.forEach((fn) => fn());
    };
  }, [updateProgress, updateStatus, setOutputPath]);
}

import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";
import { useQueueStore } from "@/store/queueStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";
import { hasEffectiveOverride } from "@/lib/overrideUtils";
import { generateThumbnail } from "@/hooks/useThumbnail";
import { TAURI_COMMANDS } from "@/lib/constants";
import type { MediaType } from "@/types";
import type { FileRowProps } from "./types";

export function useFileRow({
  item,
  onRemove,
  onPreview,
}: Pick<FileRowProps, "item" | "onRemove" | "onPreview">) {
  const {
    setThumbnail,
    setThumbnailLoading,
    setThumbnailError,
    updateItemOverride,
    toggleSelection,
    isProcessing,
    expandedId,
    setExpandedId,
  } = useQueueStore();
  const { settings: globalSettings } = useSettingsStore();

  const isExpanded = expandedId === item.id;

  const handleThumbnailLoad = (
    id: string,
    inputPath: string,
    mediaType: MediaType,
  ) => {
    setThumbnailLoading(id);
    generateThumbnail(id, inputPath, mediaType)
      .then((thumbnailPath) => {
        if (thumbnailPath) {
          setThumbnail(id, thumbnailPath);
        } else {
          setThumbnailError(id);
        }
      })
      .catch(() => {
        setThumbnailError(id);
      });
  };

  const mergedSettings = {
    ...globalSettings,
    ...(item.overrideSettings || {}),
  };

  const originalFormat = item.inputPath.split(".").pop()?.toLowerCase();

  const hasOverride = hasEffectiveOverride(
    item.overrideSettings,
    globalSettings,
  );

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-prevent-select]")) return;
    if (e.ctrlKey || e.metaKey) {
      toggleSelection(item.id);
    } else {
      setExpandedId(isExpanded ? null : item.id);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(isExpanded ? null : item.id);
  };

  const { addToast } = useToastStore();
  const handleRevealInExplorer = async () => {
    const path =
      item.status === "completed" && item.outputPath
        ? item.outputPath
        : item.inputPath;
    try {
      const exists = await invoke<boolean>(TAURI_COMMANDS.CHECK_FILE_EXISTS, {
        path,
      });
      if (!exists) {
        addToast("File not found", "error");
        return;
      }
      await revealItemInDir(path);
    } catch (err) {
      console.error("Failed to reveal item:", err);
      addToast("Failed to open location.", "error");
    }
  };

  const handleDelete = () => {
    if (!isProcessing) {
      onRemove(item.id);
    }
  };

  const handleThumbnailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.thumbnailPath) {
      onPreview(item.thumbnailPath);
    }
  };

  return {
    isExpanded,
    isProcessing,
    mergedSettings,
    originalFormat,
    hasOverride,
    updateItemOverride,
    toggleSelection,
    handleThumbnailLoad,
    handleClick,
    handleToggleExpand,
    handleRevealInExplorer,
    handleDelete,
    handleThumbnailClick,
  };
}

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";
import {
  ChevronDown,
  X,
  Check,
  AlertCircle,
  Loader2,
  FolderOpen,
  Trash2,
  Video,
  Image,
  Music,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils";
import { hasEffectiveOverride } from "@/lib/overrideUtils";
import { SettingsPanel } from "@/components/settings";
import { useQueueStore } from "@/store/queueStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";
import type { QueueItem, ProcessStatus, MediaType } from "@/types";
import { useThumbnail } from "@/hooks/useThumbnail";
import { LazyThumbnail } from "@/components/ui/LazyThumbnail";
import { ROW_HEIGHT, TAURI_COMMANDS } from "@/lib/constants";
import { accordion, progressBar } from "@/lib/animations";

interface FileRowProps {
  item: QueueItem;
  isSelected: boolean;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onPreview: (path: string) => void;
}

const statusConfig: Record<
  ProcessStatus,
  {
    icon: typeof Check;
    badgeClass: string;
    label: string;
  }
> = {
  pending: { icon: Loader2, badgeClass: "badge-pending", label: "Pending" },
  processing: {
    icon: Loader2,
    badgeClass: "badge-processing",
    label: "Processing",
  },
  completed: { icon: Check, badgeClass: "badge-completed", label: "Completed" },
  error: { icon: AlertCircle, badgeClass: "badge-error", label: "Error" },
  cancelled: { icon: X, badgeClass: "badge-cancelled", label: "Cancelled" },
  conflict: {
    icon: AlertCircle,
    badgeClass: "badge-cancelled",
    label: "Conflict",
  },
};

const mediaIcons: Record<MediaType, typeof Video> = {
  video: Video,
  image: Image,
  audio: Music,
};

export const FileRow = memo(function FileRow({
  item,
  isSelected,
  onRemove,
  onCancel,
  onPreview,
}: FileRowProps) {
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

  const { generateThumbnail } = useThumbnail();

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

  const status = statusConfig[item.status];
  const StatusIcon = status.icon;
  const MediaIcon = mediaIcons[item.mediaType];

  const mergedSettings = {
    ...globalSettings,
    ...(item.overrideSettings || {}),
  };

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
    const path = item.outputPath || item.inputPath;
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

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          style={{ minHeight: ROW_HEIGHT }}
          className={cn(
            "group border-b border-border-subtle",
            "transition-colors duration-150",
            "box-border",
            isSelected ? "bg-neon-cyan/5" : "hover:bg-slate/20",
          )}
        >
          <div
            onClick={handleClick}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer"
          >
            <div
              data-prevent-select
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center",
                "transition-all duration-150 cursor-pointer",
                isSelected
                  ? "bg-neon-cyan border-neon-cyan"
                  : "border-zinc hover:border-ash",
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleSelection(item.id);
              }}
            >
              {isSelected && <Check className="w-3 h-3 text-void" />}
            </div>

            <div
              className={cn(
                "w-12 h-12 shrink-0 group/thumb",
                "relative",
                item.thumbnailPath && "cursor-pointer",
              )}
              onClick={handleThumbnailClick}
            >
              {item.thumbnailPath && (
                <div className="absolute inset-0 bg-void/60 rounded-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <ZoomIn className="w-5 h-5 text-snow drop-shadow-md" />
                </div>
              )}
              <LazyThumbnail
                id={item.id}
                inputPath={item.inputPath}
                mediaType={item.mediaType}
                thumbnailPath={item.thumbnailPath}
                thumbnailStatus={item.thumbnailStatus}
                onLoadRequest={handleThumbnailLoad}
                fallbackIcon={MediaIcon}
                iconColorClass={`text-media-${item.mediaType}`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-medium text-snow truncate"
                  title={item.fileName}
                >
                  {item.fileName}
                </span>
                {hasOverride && (
                  <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-plasma-pink/10 text-plasma-pink">
                    OVERRIDE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-ash">
                <span>{formatFileSize(item.fileSize)}</span>
                <span>•</span>
                <span className="uppercase">{item.mediaType}</span>
              </div>
            </div>

            <div className={cn("badge", status.badgeClass)}>
              <StatusIcon
                className={cn(
                  "w-3.5 h-3.5",
                  item.status === "processing" && "animate-spin",
                )}
              />
              {status.label}
            </div>

            {(item.status === "processing" ||
              item.status === "cancelled" ||
              item.status === "error") &&
              item.progress > 0 && (
                <div className="w-24 h-1.5 bg-slate rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full",
                      item.status === "processing" &&
                        "bg-linear-to-r from-neon-cyan to-electric-violet",
                      item.status === "error" && "bg-danger-red",
                      item.status === "cancelled" && "bg-warning-amber",
                    )}
                    variants={progressBar}
                    initial="initial"
                    animate="animate"
                    custom={item.progress}
                  />
                </div>
              )}

            <div className="flex items-center gap-1" data-prevent-select>
              {item.status === "processing" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(item.id);
                  }}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    "text-ash hover:text-danger-red hover:bg-danger-red/10",
                  )}
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleToggleExpand}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  "text-ash hover:text-smoke hover:bg-slate/50",
                  isExpanded && "bg-slate/50 text-neon-cyan",
                )}
                title="File Settings"
              >
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                variants={accordion}
                initial="initial"
                animate="animate"
                exit="exit"
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 ml-8 border-l-2 border-neon-cyan/30">
                  <SettingsPanel
                    settings={mergedSettings}
                    onSettingsChange={(updates) => {
                      updateItemOverride(item.id, updates);
                    }}
                    mediaType={item.mediaType}
                    mode="local"
                  />
                  {hasOverride && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateItemOverride(item.id, null);
                      }}
                      className="mt-3 px-3 py-1.5 text-xs text-ash hover:text-smoke border border-border-subtle rounded-lg hover:bg-slate/30 transition-colors"
                    >
                      Clear Override
                    </button>
                  )}
                </div>
                {item.errorMessage && (
                  <div className="px-4 pb-3 ml-8">
                    <div className="px-3 py-2 rounded-lg bg-danger-red/10 border border-danger-red/30 text-xs text-danger-red">
                      {item.errorMessage}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="context-menu-content">
          <ContextMenu.Item
            onClick={handleRevealInExplorer}
            className="context-menu-item"
          >
            <FolderOpen className="w-4 h-4 text-ash" />
            <span>Open Location</span>
          </ContextMenu.Item>
          <ContextMenu.Separator className="h-px my-1.5 bg-border-subtle" />
          <ContextMenu.Item
            onClick={handleDelete}
            disabled={isProcessing}
            className={cn(
              "context-menu-item-danger",
              isProcessing && "opacity-50 cursor-not-allowed",
            )}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
});

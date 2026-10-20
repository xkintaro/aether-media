import { memo } from "react";
import { AnimatePresence } from "framer-motion";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { ChevronDown, X, Check, ZoomIn } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { LazyThumbnail } from "@/components/ui/LazyThumbnail";
import { ROW_HEIGHT } from "@/lib/constants";
import type { FileRowProps } from "./row/types";
import { mediaIcons } from "./row/presentation";
import { useFileRow } from "./row/useFileRow";
import { FileRowStatus } from "./row/FileRowStatus";
import { FileRowDetails } from "./row/FileRowDetails";
import { FileRowContextMenu } from "./row/FileRowContextMenu";

export const FileRow = memo(function FileRow({
  item,
  isSelected,
  onRemove,
  onCancel,
  onPreview,
}: FileRowProps) {
  const {
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
  } = useFileRow({ item, onRemove, onPreview });
  const MediaIcon = mediaIcons[item.mediaType];

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

            <FileRowStatus item={item} />

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
              <FileRowDetails
                item={item}
                mergedSettings={mergedSettings}
                originalFormat={originalFormat}
                hasOverride={hasOverride}
                updateItemOverride={updateItemOverride}
              />
            )}
          </AnimatePresence>
        </div>
      </ContextMenu.Trigger>

      <FileRowContextMenu
        isProcessing={isProcessing}
        handleRevealInExplorer={handleRevealInExplorer}
        handleDelete={handleDelete}
      />
    </ContextMenu.Root>
  );
});

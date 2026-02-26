import { memo, useCallback, useRef, useState, useMemo, useEffect } from "react";
import { Trash2, Square, CheckSquare, RotateCcw } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn, computeQueueStats } from "@/lib/utils";
import { useQueueStore } from "@/store/queueStore";
import { useAppSettingsStore } from "@/store/appSettingsStore";
import { useToastStore } from "@/store/toastStore";
import { FileRow } from "./FileRow";
import { FileRowSkeleton } from "./FileRowSkeleton";
import { DropZone } from "./DropZone";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { CompletedRetryDialog } from "@/components/ui/CompletedRetryDialog";
import { invoke } from "@tauri-apps/api/core";
import {
  ROW_HEIGHT,
  EXPANDED_ROW_HEIGHT,
  VIRTUAL_OVERSCAN,
  SCROLL_VELOCITY_THRESHOLD,
  SCROLL_DEBOUNCE_MS,
  TAURI_COMMANDS,
} from "@/lib/constants";

interface VirtualRowProps {
  index: number;
  start: number;
  measureElement: (element: Element | null) => void;
  children: React.ReactNode;
}

const VirtualRow = ({
  index,
  start,
  measureElement,
  children,
}: VirtualRowProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    measureElement(element);
    const observer = new ResizeObserver(() => {
      measureElement(element);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [measureElement]);
  return (
    <div
      ref={ref}
      data-index={index}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        transform: `translateY(${start}px)`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};

export const FileTable = memo(function FileTable() {
  const {
    items,
    selectedIds,
    selectAll,
    deselectAll,
    removeItems,
    isProcessing,
    expandedId,
    hasPersistedQueue,
    sessionRestoreHandled,
    retryCompleted,
  } = useQueueStore();
  const { addToast } = useToastStore();
  const { autoRestoreSession } = useAppSettingsStore();

  const isSessionRestoreActive =
    hasPersistedQueue && !sessionRestoreHandled && !autoRestoreSession;
  const parentRef = useRef<HTMLDivElement>(null);
  const [isRetryDialogOpen, setIsRetryDialogOpen] = useState(false);

  const hasItems = items.length > 0;
  const allSelected = hasItems && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const selectedCount = selectedIds.size;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = items[index];
      return item?.id === expandedId ? EXPANDED_ROW_HEIGHT : ROW_HEIGHT;
    },
    overscan: VIRTUAL_OVERSCAN,
    getItemKey: (index) => items[index].id,
    measureElement: (element) =>
      element?.getBoundingClientRect().height ?? ROW_HEIGHT,
  });

  const [isFastScrolling, setIsFastScrolling] = useState(false);
  const lastScrollRef = useRef({ top: 0, time: 0 });
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handlePreview = useCallback((path: string) => {
    setPreviewImage(path);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentTop = e.currentTarget.scrollTop;
    const currentTime = Date.now();
    const timeDelta = currentTime - lastScrollRef.current.time;

    if (timeDelta > 16) {
      const distance = Math.abs(currentTop - lastScrollRef.current.top);
      const velocity = distance / timeDelta;

      if (velocity > SCROLL_VELOCITY_THRESHOLD) {
        if (!isFastScrolling) setIsFastScrolling(true);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

        scrollTimeoutRef.current = setTimeout(() => {
          setIsFastScrolling(false);
        }, SCROLL_DEBOUNCE_MS);
      }
      lastScrollRef.current = { top: currentTop, time: currentTime };
    }
  };

  const virtualItems = virtualizer.getVirtualItems();

  const handleRemove = useCallback(
    (id: string) => {
      invoke(TAURI_COMMANDS.DELETE_THUMBNAILS, { fileIds: [id] }).catch(
        console.error,
      );
      removeItems([id]);
    },
    [removeItems],
  );

  const handleCancel = useCallback((id: string) => {
    invoke(TAURI_COMMANDS.CANCEL_CONVERSION, { id }).catch(console.error);
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size > 0) {
      const ids = [...selectedIds];
      invoke(TAURI_COMMANDS.DELETE_THUMBNAILS, { fileIds: ids }).catch(
        console.error,
      );
      removeItems(ids);
    }
  }, [selectedIds, removeItems]);

  const handleToggleAll = useCallback(() => {
    if (allSelected || someSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [allSelected, someSelected, selectAll, deselectAll]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSessionRestoreActive) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        const activeElement = document.activeElement as HTMLElement;
        const isInputActive =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.isContentEditable);

        if (isInputActive) {
          return;
        }

        e.preventDefault();
        if (allSelected) {
          deselectAll();
        } else {
          selectAll();
        }
        return;
      }

      if (e.key === "Escape") {
        deselectAll();
        return;
      }

      if (e.key === "Delete") {
        if (selectedIds.size === 0 || isProcessing) return;

        const ids = [...selectedIds];
        invoke(TAURI_COMMANDS.DELETE_THUMBNAILS, { fileIds: ids }).catch(
          console.error,
        );
        removeItems(ids);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectAll,
    deselectAll,
    allSelected,
    selectedIds,
    isProcessing,
    removeItems,
    isSessionRestoreActive,
  ]);

  const stats = useMemo(() => {
    if (!items.length) return null;
    return computeQueueStats(items);
  }, [items]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {hasItems && (
        <div className="flex items-center justify-between px-4 py-2 bg-graphite/50 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAll}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg",
                "text-xs font-medium transition-colors",
                allSelected || someSelected
                  ? "text-neon-cyan bg-neon-cyan/10"
                  : "text-ash hover:text-smoke hover:bg-slate/50",
              )}
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : someSelected ? (
                <Square className="w-4 h-4 fill-zinc" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {allSelected
                ? "Deselect All"
                : someSelected
                  ? `${selectedCount} selected`
                  : "Select All"}
            </button>

            {selectedCount > 0 && (
              <div className="flex items-center gap-1 pl-3 border-l border-border-subtle">
                <button
                  onClick={handleBulkDelete}
                  disabled={isProcessing}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    isProcessing
                      ? "text-ash/50 cursor-not-allowed"
                      : "text-danger-red hover:bg-danger-red/10",
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete ({selectedCount})
                </button>
              </div>
            )}

            {stats && stats.success > 0 && !isProcessing && (
              <div className="flex items-center gap-1 pl-3 border-l border-border-subtle">
                <button
                  onClick={() => setIsRetryDialogOpen(true)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-add
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-[10px] sm:text-xs font-mono tracking-wide uppercase select-none">
            {stats && (
              <>
                {stats.success > 0 && (
                  <>
                    <div className="text-ash/60">
                      <span className="text-success-green/80">
                        {stats.success}
                      </span>
                      <span className="ml-1.5 hidden sm:inline">SUCCESS</span>
                    </div>
                    <div className="w-px h-3 bg-border-subtle" />
                  </>
                )}
                {stats.cancelled > 0 && (
                  <>
                    <div className="text-ash/60">
                      <span className="text-yellow-500/80">
                        {stats.cancelled}
                      </span>
                      <span className="ml-1.5 hidden sm:inline">CANCELLED</span>
                    </div>
                    <div className="w-px h-3 bg-border-subtle" />
                  </>
                )}
                {stats.error > 0 && (
                  <>
                    <div className="text-ash/60">
                      <span className="text-danger-red/80">{stats.error}</span>
                      <span className="ml-1.5 hidden sm:inline">ERRORS</span>
                    </div>
                    <div className="w-px h-3 bg-border-subtle" />
                  </>
                )}
                {stats.processed > 0 && (
                  <>
                    <div className="text-ash/60">
                      <span className="text-snow/90">{stats.processed}</span>
                      <span className="ml-1.5 hidden sm:inline">PROCESSED</span>
                    </div>
                    <div className="w-px h-3 bg-border-subtle" />
                  </>
                )}
                {stats.remaining > 0 && (
                  <>
                    <div className="text-ash/60">
                      <span className="text-electric-violet/80">
                        {stats.remaining}
                      </span>
                      <span className="ml-1.5 hidden sm:inline">REMAINING</span>
                    </div>
                    <div className="w-px h-3 bg-border-subtle" />
                  </>
                )}
                <div className="text-ash/60">
                  <span>{stats.total}</span>
                  <span className="ml-1.5 hidden sm:inline">TOTAL</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {hasItems ? (
        <div
          ref={parentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-auto"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualRow) => {
              const item = items[virtualRow.index];
              if (!item) return null;

              return (
                <VirtualRow
                  key={virtualRow.key}
                  index={virtualRow.index}
                  start={virtualRow.start}
                  measureElement={virtualizer.measureElement}
                >
                  {isFastScrolling && item.id !== expandedId ? (
                    <FileRowSkeleton />
                  ) : (
                    <FileRow
                      item={item}
                      isSelected={selectedIds.has(item.id)}
                      onRemove={handleRemove}
                      onCancel={handleCancel}
                      onPreview={handlePreview}
                    />
                  )}
                </VirtualRow>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <DropZone />
        </div>
      )}

      {hasItems && (
        <div className="border-t border-border-subtle">
          <DropZone compact />
        </div>
      )}

      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={closePreview}
        imagePath={previewImage}
      />

      {stats && (
        <CompletedRetryDialog
          isOpen={isRetryDialogOpen}
          onClose={() => setIsRetryDialogOpen(false)}
          onConfirm={() => {
            retryCompleted();
            addToast(`${stats.success} file(s) added back to queue`, "info");
          }}
          count={stats.success}
        />
      )}
    </div>
  );
});

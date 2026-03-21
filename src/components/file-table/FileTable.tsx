import { memo, useCallback, useRef, useState, useMemo, useEffect } from "react";
import type { ProcessStatus } from "@/types";
import { Trash2, Square, CheckSquare, RotateCcw } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn, computeQueueStats, formatFileSize } from "@/lib/utils";
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
  FAST_SCROLL_STREAK,
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
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | null>(null);

  const filteredItems = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const toggleFilter = useCallback((status: ProcessStatus) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  }, []);

  const hasItems = items.length > 0;
  const hasFilteredItems = filteredItems.length > 0;
  const allSelected = hasItems && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const selectedCount = selectedIds.size;

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = filteredItems[index];
      return item?.id === expandedId ? EXPANDED_ROW_HEIGHT : ROW_HEIGHT;
    },
    overscan: VIRTUAL_OVERSCAN,
    getItemKey: (index) => filteredItems[index].id,
    measureElement: (element) =>
      element?.getBoundingClientRect().height ?? ROW_HEIGHT,
  });

  const [isFastScrolling, setIsFastScrolling] = useState(false);
  const lastScrollRef = useRef({ top: 0, time: 0 });
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fastStreakRef = useRef(0);
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
        fastStreakRef.current += 1;

        if (fastStreakRef.current >= FAST_SCROLL_STREAK && !isFastScrolling) {
          setIsFastScrolling(true);
        }

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          setIsFastScrolling(false);
          fastStreakRef.current = 0;
        }, SCROLL_DEBOUNCE_MS);
      } else {
        fastStreakRef.current = 0;
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

          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono tracking-wide uppercase select-none">
            {stats && (
              <>
                {stats.success > 0 && (
                  <button
                    onClick={() => toggleFilter("completed")}
                    className={cn(
                      "relative group flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
                      statusFilter === "completed"
                        ? "bg-success-green/20 text-success-green ring-1 ring-success-green/40"
                        : "text-ash/60 hover:text-ash hover:bg-slate/40",
                    )}
                  >
                    <span className={cn(statusFilter === "completed" ? "text-success-green" : "text-success-green/80")}>
                      {stats.success}
                    </span>
                    <span className="hidden sm:inline">SUCCESS</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-graphite border border-border-subtle rounded-md text-snow text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      {formatFileSize(stats.successSize)}
                    </div>
                  </button>
                )}
                {stats.cancelled > 0 && (
                  <button
                    onClick={() => toggleFilter("cancelled")}
                    className={cn(
                      "relative group flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
                      statusFilter === "cancelled"
                        ? "bg-yellow-500/20 text-yellow-500 ring-1 ring-yellow-500/40"
                        : "text-ash/60 hover:text-ash hover:bg-slate/40",
                    )}
                  >
                    <span className={cn(statusFilter === "cancelled" ? "text-yellow-500" : "text-yellow-500/80")}>
                      {stats.cancelled}
                    </span>
                    <span className="hidden sm:inline">CANCELLED</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-graphite border border-border-subtle rounded-md text-snow text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      {formatFileSize(stats.cancelledSize)}
                    </div>
                  </button>
                )}
                {stats.error > 0 && (
                  <button
                    onClick={() => toggleFilter("error")}
                    className={cn(
                      "relative group flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
                      statusFilter === "error"
                        ? "bg-danger-red/20 text-danger-red ring-1 ring-danger-red/40"
                        : "text-ash/60 hover:text-ash hover:bg-slate/40",
                    )}
                  >
                    <span className={cn(statusFilter === "error" ? "text-danger-red" : "text-danger-red/80")}>
                      {stats.error}
                    </span>
                    <span className="hidden sm:inline">ERRORS</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-graphite border border-border-subtle rounded-md text-snow text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      {formatFileSize(stats.errorSize)}
                    </div>
                  </button>
                )}
                {stats.remaining > 0 && (
                  <button
                    onClick={() => toggleFilter("pending")}
                    className={cn(
                      "relative group flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
                      statusFilter === "pending"
                        ? "bg-electric-violet/20 text-electric-violet ring-1 ring-electric-violet/40"
                        : "text-ash/60 hover:text-ash hover:bg-slate/40",
                    )}
                  >
                    <span className={cn(statusFilter === "pending" ? "text-electric-violet" : "text-electric-violet/80")}>
                      {stats.remaining}
                    </span>
                    <span className="hidden sm:inline">REMAINING</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-graphite border border-border-subtle rounded-md text-snow text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      {formatFileSize(stats.remainingSize)}
                    </div>
                  </button>
                )}
                <div className="w-px h-3 bg-border-subtle mx-0.5" />
                <button
                  onClick={() => setStatusFilter(null)}
                  className={cn(
                    "relative group flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
                    statusFilter === null
                      ? "bg-slate/60 text-snow ring-1 ring-ash/30"
                      : "text-ash/60 hover:text-ash hover:bg-slate/40",
                  )}
                >
                  <span>{stats.total}</span>
                  <span className="hidden sm:inline">TOTAL</span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-graphite border border-border-subtle rounded-md text-snow text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    {formatFileSize(stats.totalSize)}
                  </div>
                </button>
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
          {hasFilteredItems ? (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualItems.map((virtualRow) => {
                const item = filteredItems[virtualRow.index];
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
          ) : (
            <div className="flex-1 flex items-center justify-center py-16 text-ash/50 text-sm">
              No files matching this filter
            </div>
          )}
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

import { VirtualRow } from "./VirtualRow";
import { useScrollActivity } from "./useScrollActivity";
import { useFileTableActions } from "./useFileTableActions";
import { FileTableToolbar } from "./FileTableToolbar";
import { memo, useCallback, useRef, useState, useMemo } from "react";
import type { ProcessStatus } from "@/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { computeQueueStats } from "@/lib/utils";
import { useQueueStore } from "@/store/queueStore";
import { useToastStore } from "@/store/toastStore";
import { FileRow } from "./FileRow";
import { FileRowSkeleton } from "./FileRowSkeleton";
import { DropZone } from "./DropZone";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { CompletedRetryDialog } from "@/components/ui/CompletedRetryDialog";
import {
  ROW_HEIGHT,
  EXPANDED_ROW_HEIGHT,
  VIRTUAL_OVERSCAN,
} from "@/lib/constants";

export const FileTable = memo(function FileTable() {
  const { items, selectedIds, isProcessing, expandedId, retryCompleted } =
    useQueueStore();
  const { addToast } = useToastStore();
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

  const { isFastScrolling, handleScroll } = useScrollActivity();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handlePreview = useCallback((path: string) => {
    setPreviewImage(path);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const virtualItems = virtualizer.getVirtualItems();

  const { handleRemove, handleCancel, handleBulkDelete, handleToggleAll } =
    useFileTableActions(allSelected, someSelected);

  const stats = useMemo(() => {
    if (!items.length) return null;
    return computeQueueStats(items);
  }, [items]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {hasItems && (
        <FileTableToolbar
          allSelected={allSelected}
          someSelected={someSelected}
          selectedCount={selectedCount}
          isProcessing={isProcessing}
          stats={stats}
          statusFilter={statusFilter}
          toggleFilter={toggleFilter}
          setStatusFilter={setStatusFilter}
          setIsRetryDialogOpen={setIsRetryDialogOpen}
          handleToggleAll={handleToggleAll}
          handleBulkDelete={handleBulkDelete}
        />
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

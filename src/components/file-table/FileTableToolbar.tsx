import { Trash2, Square, CheckSquare, RotateCcw } from "lucide-react";
import { cn, computeQueueStats } from "@/lib/utils";
import type { ProcessStatus } from "@/types";
import { QueueStatusFilters } from "./QueueStatusFilters";

interface FileTableToolbarProps {
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
  isProcessing: boolean;
  stats: ReturnType<typeof computeQueueStats> | null;
  statusFilter: ProcessStatus | null;
  toggleFilter: (status: ProcessStatus) => void;
  setStatusFilter: (status: ProcessStatus | null) => void;
  setIsRetryDialogOpen: (open: boolean) => void;
  handleToggleAll: () => void;
  handleBulkDelete: () => void;
}

export function FileTableToolbar({
  allSelected,
  someSelected,
  selectedCount,
  isProcessing,
  stats,
  statusFilter,
  toggleFilter,
  setStatusFilter,
  setIsRetryDialogOpen,
  handleToggleAll,
  handleBulkDelete,
}: FileTableToolbarProps) {
  return (
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

      <QueueStatusFilters
        stats={stats}
        statusFilter={statusFilter}
        toggleFilter={toggleFilter}
        setStatusFilter={setStatusFilter}
      />
    </div>
  );
}

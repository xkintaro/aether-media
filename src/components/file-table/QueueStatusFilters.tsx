import type { ProcessStatus } from "@/types";
import { cn, computeQueueStats, formatFileSize } from "@/lib/utils";

interface QueueStatusFiltersProps {
  stats: ReturnType<typeof computeQueueStats> | null;
  statusFilter: ProcessStatus | null;
  toggleFilter: (status: ProcessStatus) => void;
  setStatusFilter: (status: ProcessStatus | null) => void;
}

export function QueueStatusFilters({
  stats,
  statusFilter,
  toggleFilter,
  setStatusFilter,
}: QueueStatusFiltersProps) {
  return (
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
              <span
                className={cn(
                  statusFilter === "completed"
                    ? "text-success-green"
                    : "text-success-green/80",
                )}
              >
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
              <span
                className={cn(
                  statusFilter === "cancelled"
                    ? "text-yellow-500"
                    : "text-yellow-500/80",
                )}
              >
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
              <span
                className={cn(
                  statusFilter === "error"
                    ? "text-danger-red"
                    : "text-danger-red/80",
                )}
              >
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
              <span
                className={cn(
                  statusFilter === "pending"
                    ? "text-electric-violet"
                    : "text-electric-violet/80",
                )}
              >
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
  );
}

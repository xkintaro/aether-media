import { memo } from "react";
import { ROW_HEIGHT } from "@/lib/constants";

export const FileRowSkeleton = memo(function FileRowSkeleton() {
  return (
    <div
      style={{ height: ROW_HEIGHT }}
      className="border-b border-border-subtle bg-slate/5 box-border"
    >
      <div className="flex items-center gap-3 px-4 py-3 h-full">
        <div className="w-5 h-5 rounded border-2 border-zinc/20 bg-zinc/5" />
        <div className="w-12 h-12 rounded-lg bg-graphite border border-border-subtle overflow-hidden relative shrink-0">
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-white/0 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 w-1/3 bg-zinc/10 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
          <div className="h-3 w-1/4 bg-zinc/5 rounded-sm" />
        </div>
        <div className="w-20 h-6 rounded-full bg-zinc/5" />
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 rounded-lg bg-zinc/5" />
        </div>
      </div>
    </div>
  );
});

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { progressBar } from "@/lib/animations";
import type { QueueItem } from "@/types";
import { statusConfig } from "./presentation";

export function FileRowStatus({ item }: { item: QueueItem }) {
  const status = statusConfig[item.status];
  const StatusIcon = status.icon;
  return (
    <>
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
    </>
  );
}

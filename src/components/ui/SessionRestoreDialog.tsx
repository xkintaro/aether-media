import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useQueueStore } from "@/store/queueStore";
import { cn } from "@/lib/utils";
import { fadeIn, scaleIn } from "@/lib/animations";

interface SessionRestoreDialogProps {
  onRestore: () => void;
  onDiscard: () => void;
}

export function SessionRestoreDialog({
  onRestore,
  onDiscard,
}: SessionRestoreDialogProps) {
  const { items } = useQueueStore();
  const stats = {
    total: items.length,
    completed: items.filter((i) => i.status === "completed").length,
    pending: items.filter((i) => i.status === "pending").length,
    error: items.filter((i) => i.status === "error").length,
    processing: items.filter((i) => i.status === "processing").length,
  };

  return (
    <AnimatePresence>
      <div className="modal-backdrop z-(--z-session-dialog)">
        <motion.div
          className="absolute inset-0 z-(--z-modal)"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
        />
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className="modal-content z-(--z-modal)"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-neon-cyan/10">
                <Clock className="w-5 h-5 text-neon-cyan" />
              </div>
              <h2 className="text-lg font-display font-semibold text-snow">
                Previous Session Found
              </h2>
            </div>
            <p className="text-sm text-ash leading-relaxed">
              Files from your last session were found. Would you like to resume
              where you left off?
            </p>
          </div>
          <div className="mx-6 mb-5 p-4 rounded-lg bg-surface-secondary/50 border border-border-subtle">
            <div className="grid grid-cols-2 gap-3">
              <StatItem
                icon={<FolderOpen className="w-4 h-4" />}
                label="Total Files"
                value={stats.total}
                color="text-snow"
              />
              <StatItem
                icon={<CheckCircle className="w-4 h-4" />}
                label="Completed"
                value={stats.completed}
                color="text-success-green"
              />
              <StatItem
                icon={<Clock className="w-4 h-4" />}
                label="Pending"
                value={stats.pending}
                color="text-neon-cyan"
              />
              <StatItem
                icon={<AlertCircle className="w-4 h-4" />}
                label="Failed"
                value={stats.error}
                color="text-danger-red"
              />
            </div>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <motion.button onClick={onDiscard} className="btn-ghost flex-1">
              <Trash2 className="w-4 h-4" />
              Clear
            </motion.button>
            <motion.button onClick={onRestore} className="btn-neon flex-1">
              <FolderOpen className="w-4 h-4" />
              Resume
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("opacity-60", color)}>{icon}</span>
      <div className="flex flex-col">
        <span className="text-xs text-ash">{label}</span>
        <span className={cn("text-sm font-semibold", color)}>{value}</span>
      </div>
    </div>
  );
}

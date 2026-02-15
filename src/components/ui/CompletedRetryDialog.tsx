import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, X, CheckCircle } from "lucide-react";
import { fadeIn, scaleIn } from "@/lib/animations";

interface CompletedRetryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

export function CompletedRetryDialog({
  isOpen,
  onClose,
  onConfirm,
  count,
}: CompletedRetryDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop z-(--z-modal)">
          <motion.div
            className="absolute inset-0 z-(--z-modal)"
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="modal-content z-(--z-modal)"
          >
            <div className="p-6">
              <div className="w-full flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-neon-cyan/10">
                    <CheckCircle className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <h2 className="text-lg font-display font-semibold text-snow">
                    Re-processing Confirmation
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-ash hover:text-smoke hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 rounded-lg bg-surface-secondary/50 border border-border-subtle mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-sm text-ash leading-relaxed">
                    Total{" "}
                    <span className="text-snow font-semibold">{count}</span>{" "}
                    completed files will be added to re-processing queue.
                  </div>
                </div>
              </div>
              <p className="text-sm text-ash/80">
                This action will reset file status and restart processing. Do
                you want to continue?
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1 py-2.5">
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="btn-neon flex-1 py-2.5  group"
              >
                <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
                Re-process
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, RefreshCw, SkipForward, X } from "lucide-react";
import { fadeIn, scaleIn } from "@/lib/animations";

interface RetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSkip: () => void;
  errorCount: number;
}

export function RetryModal({
  isOpen,
  onClose,
  onRetry,
  onSkip,
  errorCount,
}: RetryModalProps) {
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
          ></motion.div>
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="modal-content z-(--z-modal)"
          >
            <div className="p-6">
              <div className="w-full flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-warning-amber/10">
                    <AlertCircle className="w-5 h-5 text-warning-amber" />
                  </div>
                  <h2 className="text-lg font-display font-semibold text-snow">
                    Failed Files Found
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-ash hover:text-smoke transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-ash leading-relaxed">
                Found (
                <span className="text-danger-red font-semibold">
                  {errorCount}
                </span>
                ) failed files in the list. How would you like to handle these
                files before proceeding?
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={onSkip} className="btn-ghost flex-1 group">
                <SkipForward className="w-6 h-6 group-hover:text-smoke transition-colors" />
                <div className="text-center">
                  <div className="text-sm font-medium ">Skip & Continue</div>
                  <div className="text-[10px] text-ash/70 mt-1">
                    Leave errors as is
                  </div>
                </div>
              </button>

              <button onClick={onRetry} className="btn-neon flex-1 group">
                <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                <div className="text-center">
                  <div className="text-sm font-medium">Retry</div>
                  <div className="text-[10px] text-neon-cyan/70 mt-1">
                    Reset errors and process
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

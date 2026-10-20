import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileDropOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop z-(--z-drag-overlay)"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={cn(
          "flex flex-col items-center gap-4 p-12",
          "rounded-2xl border-2 border-dashed border-neon-cyan",
          "bg-neon-cyan/5",
        )}
      >
        <div>
          <Upload className="w-12 h-12 text-neon-cyan" />
        </div>
        <div className="text-center">
          <p className="text-xl font-display font-semibold text-snow">
            Drop Files
          </p>
          <p className="text-sm text-ash mt-1">Video, image or audio files</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { X, FolderInput, CheckCircle, MousePointerClick } from "lucide-react";
import { useUploadStore } from "@/store/uploadStore";
import { cn } from "@/lib/utils";
import { fadeIn, scaleIn } from "@/lib/animations";

export function UploadOverlay() {
  const {
    isUploading,
    isComplete,
    totalFiles,
    processedFiles,
    cancelUpload,
    dismiss,
  } = useUploadStore();

  if (!isUploading) return null;

  const progress = totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0;
  const remaining = totalFiles - processedFiles;

  const handleBackdropClick = () => {
    if (isComplete) {
      dismiss();
    }
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={handleBackdropClick}
      className={cn("modal-backdrop z-(--z-upload-overlay)")}
    >
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-neon-cyan/20 to-electric-violet/20 mb-6 relative">
            <div
              className={cn(
                "absolute inset-0 rounded-2xl",
                isComplete ? "bg-success-green/10" : "bg-neon-cyan/10",
              )}
            />
            {isComplete ? (
              <CheckCircle className="w-10 h-10 text-success-green relative z-10" />
            ) : (
              <FolderInput className="w-10 h-10 text-neon-cyan relative z-10" />
            )}
          </div>
          <h2 className="text-2xl font-display font-semibold text-snow mb-3">
            {isComplete ? "Upload Complete" : "Uploading Files"}
          </h2>
          <div className="flex items-center justify-center gap-3 text-sm">
            <span
              className={cn(
                "font-mono font-medium",
                isComplete ? "text-success-green" : "text-neon-cyan",
              )}
            >
              {processedFiles.toLocaleString()}
            </span>
            <span className="text-ash">/</span>
            <span className="text-snow font-mono">
              {totalFiles.toLocaleString()}
            </span>
            <span className="text-ash">files uploaded</span>
          </div>
        </div>

        <div className="mb-8">
          <div className="h-3 bg-graphite rounded-full overflow-hidden border border-border-subtle">
            <motion.div
              className={cn(
                "h-full",
                isComplete ? "bg-success-green" : "bg-neon-cyan",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span
              className={cn(
                "font-mono font-medium",
                isComplete ? "text-success-green" : "text-neon-cyan",
              )}
            >
              {Math.round(progress)}%
            </span>
            <span className="text-ash">
              {isComplete
                ? "Completed"
                : remaining > 0
                  ? `${remaining.toLocaleString()} files remaining`
                  : "Finishing..."}
            </span>
          </div>
        </div>

        {!isComplete && (
          <button
            onClick={cancelUpload}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3.5",
              "bg-ember-orange/10 hover:bg-ember-orange/20",
              "border border-ember-orange/30 rounded-xl",
              "text-ember-orange font-medium transition-all duration-200",
              "hover:border-ember-orange/50",
            )}
          >
            <X className="w-4 h-4" />
            Cancel Upload
          </button>
        )}

        {isComplete && (
          <div className="flex items-center justify-center gap-2 text-ash">
            <MousePointerClick className="w-4 h-4" />
            <span className="text-sm">Click anywhere to close</span>
          </div>
        )}

        {!isComplete && (
          <div className="flex items-center justify-center gap-2 text-ash mt-6">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">
              Uploaded files will remain in list if cancelled
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

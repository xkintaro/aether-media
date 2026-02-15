import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { convertFileSrc } from "@tauri-apps/api/core";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { fadeIn, scaleIn } from "@/lib/animations";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagePath: string | null;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imagePath,
}: ImagePreviewModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!imagePath) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent forceMount asChild>
            <div className="modal-backdrop z-(--z-modal)">
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={onClose}
                className="absolute inset-0 z-(--z-modal)"
              />
              <motion.div
                variants={scaleIn}
                initial="initial"
                animate="animate"
                exit="exit"
                className="relative z-(--z-modal) max-w-full max-h-full outline-none"
                onClick={(e) => e.stopPropagation()}
              >
                <VisuallyHidden.Root>
                  <DialogTitle>Image Preview</DialogTitle>
                  <DialogDescription>
                    Large preview of selected file
                  </DialogDescription>
                </VisuallyHidden.Root>
                <div className="relative group">
                  <motion.img
                    src={convertFileSrc(imagePath)}
                    alt="Preview"
                    animate={{ scale: isZoomed ? 2 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={() => setIsZoomed(!isZoomed)}
                    className={`max-w-[90vw] max-h-[90vh] object-contain rounded-lg border border-border-subtle ${isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                  />
                </div>
              </motion.div>
            </div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

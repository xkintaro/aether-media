import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { convertFileSrc } from "@tauri-apps/api/core";
import { LAZY_LOAD_MARGIN, LAZY_LOAD_DELAY } from "@/lib/constants";
import { fadeIn, scaleIn } from "@/lib/animations";
import type { MediaType } from "@/types";

interface LazyThumbnailProps {
  id: string;
  inputPath: string;
  mediaType: MediaType;
  thumbnailPath?: string | null;
  thumbnailStatus: "pending" | "loading" | "loaded" | "error";
  onLoadRequest: (id: string, inputPath: string, mediaType: MediaType) => void;
  fallbackIcon: React.ElementType;
  iconColorClass?: string;
  delay?: number;
}

export const LazyThumbnail = ({
  id,
  inputPath,
  mediaType,
  thumbnailPath,
  thumbnailStatus,
  onLoadRequest,
  fallbackIcon: Icon,
  iconColorClass,
  delay = LAZY_LOAD_DELAY,
}: LazyThumbnailProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, {
    margin: `${LAZY_LOAD_MARGIN}px 0px ${LAZY_LOAD_MARGIN}px 0px`,
  });
  const [shouldLoad, setShouldLoad] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (thumbnailStatus !== "pending") return;

    if (isInView) {
      timerRef.current = setTimeout(() => {
        setShouldLoad(true);
      }, delay);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isInView, delay, thumbnailStatus]);

  useEffect(() => {
    if (shouldLoad && thumbnailStatus === "pending") {
      onLoadRequest(id, inputPath, mediaType);
    }
  }, [shouldLoad, thumbnailStatus, id, inputPath, mediaType, onLoadRequest]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-full rounded-lg overflow-hidden relative",
        "bg-graphite border border-border-subtle",
        "flex items-center justify-center",
      )}
    >
      <AnimatePresence mode="popLayout">
        {thumbnailStatus === "loaded" && thumbnailPath ? (
          <motion.img
            key="thumb"
            src={convertFileSrc(thumbnailPath)}
            alt=""
            variants={scaleIn}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : thumbnailStatus === "loading" || thumbnailStatus === "pending" ? (
          <motion.div
            key="loading"
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 flex items-center justify-center bg-graphite z-10"
          >
            <div className="absolute inset-0 bg-linear-to-br from-neon-cyan/5 to-electric-violet/5 animate-pulse" />
            <Loader2
              className={cn(
                "w-5 h-5 animate-spin relative z-10",
                iconColorClass,
              )}
            />
          </motion.div>
        ) : (
          <motion.div
            key="icon"
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="absolute inset-0 flex items-center justify-center bg-graphite z-10"
          >
            <Icon className={cn("w-5 h-5", iconColorClass)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

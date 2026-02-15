import { motion } from "framer-motion";
import { Upload, FileVideo, FileImage, FileAudio } from "lucide-react";
import { EASING, ANIMATION_DURATION } from "@/lib/constants";
import { DISPLAY_FORMATS } from "@/types";

interface DropZoneProps {
  compact?: boolean;
}

const MEDIA_TYPE_ICONS = {
  video: FileVideo,
  image: FileImage,
  audio: FileAudio,
} as const;

export function DropZone({ compact = false }: DropZoneProps) {
  if (compact) {
    return (
      <div className="py-3 px-4 flex items-center justify-center gap-2 text-ash">
        <Upload className="w-4 h-4" />
        <span className="text-xs font-medium">
          Drag and drop files or use the button above
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center">
      <div className="text-center px-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          {(["video", "image", "audio"] as const).map((type, i) => {
            const Icon = MEDIA_TYPE_ICONS[type];
            const colorClass = `text-media-${type}`;
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: ANIMATION_DURATION.SLOWER,
                  ease: EASING.SPRING,
                  delay: i * 0.1,
                }}
                className="w-14 h-14 rounded-xl bg-surface-elevated/50 border border-border-subtle flex items-center justify-center"
              >
                <Icon className={`w-6 h-6 ${colorClass}`} />
              </motion.div>
            );
          })}
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: ANIMATION_DURATION.SLOWER,
            ease: EASING.SPRING,
            delay: 0.3,
          }}
          className="text-xl font-display font-semibold text-snow mb-2"
        >
          Start Processing
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: ANIMATION_DURATION.SLOWER,
            ease: EASING.SPRING,
            delay: 0.5,
          }}
          className="text-sm text-ash max-w-sm mx-auto"
        >
          Drag video, image or audio files here
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: ANIMATION_DURATION.SLOWER,
            ease: EASING.SPRING,
            delay: 0.7,
          }}
          className="mt-6 flex flex-wrap justify-center gap-2 max-w-2/3 mx-auto"
        >
          {[
            ...DISPLAY_FORMATS.video,
            ...DISPLAY_FORMATS.image,
            ...DISPLAY_FORMATS.audio,
          ].map((format) => (
            <span
              key={format}
              className="px-2 py-0.5 text-[10px] font-mono text-ash bg-zinc/30 rounded"
            >
              {format}
            </span>
          ))}
        </motion.div>
      </div>
      <div className="absolute inset-4 rounded-xl border border-dashed border-border-subtle pointer-events-none" />
    </div>
  );
}

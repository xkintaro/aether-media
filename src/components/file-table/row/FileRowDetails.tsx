import { motion } from "framer-motion";
import { accordion } from "@/lib/animations";
import { SettingsPanel } from "@/components/settings";
import type { QueueItem, ConversionSettings } from "@/types";

interface FileRowDetailsProps {
  item: QueueItem;
  mergedSettings: ConversionSettings;
  originalFormat: string | undefined;
  hasOverride: boolean;
  updateItemOverride: (
    id: string,
    overrides: Partial<ConversionSettings> | null,
  ) => void;
}

export function FileRowDetails({
  item,
  mergedSettings,
  originalFormat,
  hasOverride,
  updateItemOverride,
}: FileRowDetailsProps) {
  return (
    <motion.div
      variants={accordion}
      initial="initial"
      animate="animate"
      exit="exit"
      className="overflow-hidden"
    >
      <div className="px-4 pb-4 pt-1 ml-8 border-l-2 border-neon-cyan/30">
        <SettingsPanel
          settings={mergedSettings}
          onSettingsChange={(updates) => {
            updateItemOverride(item.id, updates);
          }}
          mediaType={item.mediaType}
          mode="local"
          originalVideoFormats={
            item.mediaType === "video" && originalFormat
              ? [originalFormat]
              : undefined
          }
          originalImageFormats={
            item.mediaType === "image" && originalFormat
              ? [originalFormat]
              : undefined
          }
          originalAudioFormats={
            item.mediaType === "audio" && originalFormat
              ? [originalFormat]
              : undefined
          }
        />
        {hasOverride && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateItemOverride(item.id, null);
            }}
            className="mt-3 px-3 py-1.5 text-xs text-ash hover:text-smoke border border-border-subtle rounded-lg hover:bg-slate/30 transition-colors"
          >
            Clear Override
          </button>
        )}
      </div>
      {item.errorMessage && (
        <div className="px-4 pb-3 ml-8">
          <div className="px-3 py-2 rounded-lg bg-danger-red/10 border border-danger-red/30 text-xs text-danger-red">
            {item.errorMessage}
          </div>
        </div>
      )}
    </motion.div>
  );
}

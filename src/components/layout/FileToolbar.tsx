import { AnimatePresence } from "framer-motion";
import { Plus, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOLBAR_HEIGHT } from "@/lib/constants";
import { useToastStore } from "@/store/toastStore";

interface FileToolbarProps {
  overrideCount: number;
  isProcessing: boolean;
  clearAllOverrides: () => void;
  handleAddFiles: () => Promise<void>;
}

export function FileToolbar({
  overrideCount,
  isProcessing,
  clearAllOverrides,
  handleAddFiles,
}: FileToolbarProps) {
  const { addToast } = useToastStore();
  return (
    <div
      style={{ height: TOOLBAR_HEIGHT }}
      className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-3 bg-surface-secondary/30"
    >
      <AnimatePresence>
        {overrideCount > 0 && (
          <div>
            <button
              onClick={() => {
                clearAllOverrides();
                addToast(
                  `Custom settings cleared for ${overrideCount} files`,
                  "info",
                );
              }}
              disabled={isProcessing}
              className={cn(
                "btn-ghost text-sm px-5 py-2.5",
                "text-plasma-pink bg-plasma-pink/10 border-plasma-pink/20",
                "hover:bg-plasma-pink/20 hover:border-plasma-pink/40 hover:text-plasma-pink",
                isProcessing && "opacity-50 cursor-not-allowed",
              )}
            >
              <XCircle className="w-4 h-4" />
              Clear Override ({overrideCount})
            </button>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-end flex-1">
        <div>
          <button
            onClick={handleAddFiles}
            disabled={isProcessing}
            className={cn(
              "btn-neon text-sm",
              isProcessing && "opacity-50 cursor-not-allowed",
            )}
          >
            <Plus className="w-4 h-4" />
            Add Files
          </button>
        </div>
      </div>
    </div>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, RotateCcw } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ANIMATION_DURATION, EASING } from "@/lib/constants";
import { useClickOutside } from "@/hooks";
import type { OutputFormat, MediaType } from "@/types";
import { getSupportedOutputFormats, DISPLAY_FORMATS } from "@/types";

interface FormatSelectorProps {
  value: OutputFormat | null;
  onChange: (format: OutputFormat | null) => void;
  mediaType: MediaType;
  disabled?: boolean;
}

export function FormatSelector({
  value,
  onChange,
  mediaType,
  disabled = false,
}: FormatSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const supportedFormats = getSupportedOutputFormats(mediaType);
  const accentColor = `text-media-${mediaType}`;

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const formatLabelMap = useMemo(() => {
    const labels: Record<string, string> = {};
    const formats = supportedFormats;
    const displayLabels = DISPLAY_FORMATS[mediaType];

    formats.forEach((fmt, index) => {
      if (index < displayLabels.length) {
        labels[fmt] = displayLabels[index];
      } else {
        labels[fmt] = fmt.toUpperCase();
      }
    });
    return labels;
  }, [mediaType, supportedFormats]);

  const displayValue = value
    ? formatLabelMap[value] || value.toUpperCase()
    : "Original";

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 rounded-lg flex items-center justify-between",
          "bg-graphite border border-border-subtle",
          "text-sm font-medium",
          "transition-all duration-150",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-zinc cursor-pointer",
        )}
      >
        <span className={accentColor}>{displayValue}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-ash transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{
              duration: ANIMATION_DURATION.FAST,
              ease: EASING.SMOOTH,
            }}
            className={cn(
              "absolute z-(--z-dropdown) mt-1 w-full",
              "bg-graphite/95 backdrop-blur-xl",
              "border border-border-subtle rounded-lg",
              "overflow-hidden",
            )}
          >
            <div className="max-h-48 overflow-y-auto py-1">
              <button
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2 flex items-center justify-between",
                  "text-sm text-left transition-colors duration-100",
                  value === null
                    ? `bg-slate ${accentColor}`
                    : "text-smoke hover:bg-slate/50",
                )}
              >
                <span className="flex items-center gap-2 font-medium">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Original
                </span>
                {value === null && (
                  <Check className={`w-4 h-4 ${accentColor}`} />
                )}
              </button>

              <div className="border-t border-border-subtle my-1" />

              {supportedFormats.map((format) => (
                <button
                  key={format}
                  onClick={() => {
                    onChange(format);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 flex items-center justify-between",
                    "text-sm text-left transition-colors duration-100",
                    value === format
                      ? `bg-slate ${accentColor}`
                      : "text-smoke hover:bg-slate/50",
                  )}
                >
                  <span className="font-medium">
                    {formatLabelMap[format] || format.toUpperCase()}
                  </span>
                  {value === format && (
                    <Check className={`w-4 h-4 ${accentColor}`} />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { Maximize, Crop, Shrink, Scaling } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import type { ResizeMode, BackgroundColor } from "@/types";
interface ResizeConfigProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  width: number;
  height: number;
  onDimensionsChange: (w: number, h: number) => void;
  mode: ResizeMode;
  onModeChange: (mode: ResizeMode) => void;
  backgroundColor: BackgroundColor;
  onBackgroundChange: (color: BackgroundColor) => void;
}
const RESIZE_MODES: {
  value: ResizeMode;
  label: string;
  icon: typeof Maximize;
  desc: string;
}[] = [
  {
    value: "fill",
    label: "Fill",
    icon: Maximize,
    desc: "Stretch / Distort scale",
  },
  { value: "cover", label: "Cover", icon: Crop, desc: "Crop / Cut overflow" },
  {
    value: "contain",
    label: "Contain",
    icon: Shrink,
    desc: "Fit / Add padding",
  },
];
const BACKGROUND_OPTIONS: {
  value: BackgroundColor;
  label: string;
  color: string;
}[] = [
  {
    value: "transparent",
    label: "Transparent",
    color: "bg-gradient-to-br from-slate to-graphite",
  },
  { value: "black", label: "Black", color: "bg-black" },
  { value: "white", label: "White", color: "bg-white" },
];
const PRESETS = [
  { label: "1080p", w: 1920, h: 1080 },
  { label: "720p", w: 1280, h: 720 },
  { label: "4K", w: 3840, h: 2160 },
  { label: "Square", w: 1080, h: 1080 },
  { label: "Story", w: 1080, h: 1920 },
];
export function ResizeConfig({
  enabled,
  onEnabledChange,
  width,
  height,
  onDimensionsChange,
  mode,
  onModeChange,
  backgroundColor,
  onBackgroundChange,
}: ResizeConfigProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between cursor-pointer group">
        <span className="flex items-center gap-2 text-xs font-medium text-smoke">
          <Scaling className="w-3.5 h-3.5 text-electric-violet" />
          Resize
        </span>
        <ToggleSwitch checked={enabled} onChange={onEnabledChange} />
      </label>
      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
            className="space-y-3"
          >
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-ash uppercase tracking-wider mb-1 block">
                    Width
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) =>
                      onDimensionsChange(parseInt(e.target.value) || 0, height)
                    }
                    className="w-full px-2 py-1.5 text-sm font-mono bg-graphite border border-border-subtle rounded-lg text-snow focus:border-neon-cyan/50 focus:outline-none"
                    min={1}
                    max={7680}
                  />
                </div>
                <span className="text-ash mt-5">×</span>
                <div className="flex-1">
                  <label className="text-[10px] text-ash uppercase tracking-wider mb-1 block">
                    Height
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) =>
                      onDimensionsChange(width, parseInt(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1.5 text-sm font-mono bg-graphite border border-border-subtle rounded-lg text-snow focus:border-neon-cyan/50 focus:outline-none"
                    min={1}
                    max={4320}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => onDimensionsChange(preset.w, preset.h)}
                    className={cn(
                      "px-2 py-1 text-[10px] font-medium rounded-md",
                      "border border-border-subtle",
                      "transition-all duration-150",
                      width === preset.w && height === preset.h
                        ? "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30"
                        : "text-ash hover:text-smoke hover:bg-slate/50",
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-ash uppercase tracking-wider">
                  Mode
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {RESIZE_MODES.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.value}
                        onClick={() => onModeChange(m.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg",
                          "border transition-all duration-150",
                          mode === m.value
                            ? "bg-electric-violet/10 border-electric-violet/30 text-electric-violet"
                            : "border-border-subtle text-ash hover:text-smoke hover:bg-slate/30",
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-medium">
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {mode === "contain" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] text-ash uppercase tracking-wider">
                    Background
                  </label>
                  <div className="flex gap-2">
                    {BACKGROUND_OPTIONS.map((bg) => (
                      <button
                        key={bg.value}
                        onClick={() => onBackgroundChange(bg.value)}
                        className={cn(
                          "flex-1 flex items-center gap-2 p-2 rounded-lg",
                          "border transition-all duration-150",
                          backgroundColor === bg.value
                            ? "border-neon-cyan/50 ring-1 ring-neon-cyan/30"
                            : "border-border-subtle hover:border-zinc",
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded-sm border border-zinc/50",
                            bg.color,
                          )}
                        />
                        <span className="text-[10px] text-smoke">
                          {bg.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

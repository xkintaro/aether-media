import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronDown, Check } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { ANIMATION_DURATION, EASING } from "@/lib/constants";
import { useClickOutside } from "@/hooks";

export type VideoPreset =
    | "ultrafast"
    | "superfast"
    | "veryfast"
    | "faster"
    | "fast"
    | "medium"
    | "slow"
    | "slower"
    | "veryslow"
    | "placebo";

const PRESETS: { value: VideoPreset; label: string; description: string }[] = [
    { value: "ultrafast", label: "Ultra Fast", description: "Fastest encode, largest file" },
    { value: "fast", label: "Fast", description: "Good speed, reasonable size" },
    { value: "medium", label: "Medium", description: "Balanced speed & size" },
    { value: "slow", label: "Slow", description: "Better compression" },
    { value: "veryslow", label: "Very Slow", description: "Best compression" }
];

interface PresetSelectorProps {
    value: VideoPreset;
    onChange: (preset: VideoPreset) => void;
    accentColorClass?: string;
    disabled?: boolean;
}

export function PresetSelector({
    value,
    onChange,
    accentColorClass = "text-electric-violet",
    disabled = false,
}: PresetSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useClickOutside(containerRef, () => setIsOpen(false), isOpen);

    const currentPreset = PRESETS.find((p) => p.value === value) || PRESETS[5];

    return (
        <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-medium text-smoke">
                <span className="flex items-center gap-2">
                    <Zap className={cn("w-3.5 h-3.5", accentColorClass)} />
                    Video Encoder Preset
                </span>
            </label>

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
                    <span className="flex items-center gap-2">
                        <span className={accentColorClass}>{currentPreset.label}</span>
                        <span className="text-ash text-xs font-normal truncate max-w-[150px]"> {currentPreset.description}</span>
                    </span>
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
                            <div className="max-h-56 overflow-y-auto py-1">
                                {PRESETS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => {
                                            onChange(preset.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full px-3 py-2 flex items-center justify-between",
                                            "text-sm text-left transition-colors duration-100",
                                            value === preset.value
                                                ? `bg-slate ${accentColorClass}`
                                                : "text-smoke hover:bg-slate/50",
                                        )}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium">{preset.label}</span>
                                            <span className="text-[10px] text-ash tracking-tight">
                                                {preset.description}
                                            </span>
                                        </div>
                                        {value === preset.value && (
                                            <Check className={`w-4 h-4 ${accentColorClass}`} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

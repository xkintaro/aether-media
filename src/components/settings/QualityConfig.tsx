import { Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormatQualityInfo } from "@/types";
import { getQualityConfigForFormat } from "@/types";

interface QualityConfigProps {
    format: string | null;
    value: number;
    onChange: (value: number) => void;
    mediaType: "video" | "image" | "audio";
    accentColorClass?: string;
}

const MEDIA_TYPE_LABELS: Record<string, string> = {
    video: "Video Quality",
    image: "Image Quality",
    audio: "Audio Quality",
};

const MEDIA_TYPE_ICONS: Record<string, string> = {
    video: "text-electric-violet",
    image: "text-plasma-pink",
    audio: "text-ember-orange",
};

export function QualityConfig({
    format,
    value,
    onChange,
    mediaType,
    accentColorClass,
}: QualityConfigProps) {
    const config = getQualityConfigForFormat(format);
    const iconColor = accentColorClass || MEDIA_TYPE_ICONS[mediaType] || "text-neon-cyan";

    if (!config || !format) {
        return null;
    }

    if (config.isLossless) {
        return (
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-smoke">
                    <Sparkles className={cn("w-3.5 h-3.5", iconColor)} />
                    {MEDIA_TYPE_LABELS[mediaType]}
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-graphite border border-border-subtle">
                    <Info className="w-3.5 h-3.5 text-plasma-pink shrink-0" />
                    <span className="text-xs text-smoke">
                        <span className="font-medium text-plasma-pink">{format.toUpperCase()}</span>
                        {" — Lossless format"}
                    </span>
                </div>
            </div>
        );
    }

    const displayValue = getDisplayValue(value, config);
    const sliderValue = config.lowerIsBetter ? config.max - value + config.min : value;

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = parseInt(e.target.value);
        const actual = config.lowerIsBetter ? config.max - raw + config.min : raw;
        onChange(actual);
    };

    const qualityLevel = getQualityLevel(value, config);

    return (
        <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-medium text-smoke">
                <span className="flex items-center gap-2">
                    <Sparkles className={cn("w-3.5 h-3.5", iconColor)} />
                    {MEDIA_TYPE_LABELS[mediaType]}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate text-ash font-mono">
                        {format.toUpperCase()}
                    </span>
                </span>
                <span className="font-mono text-neon-cyan">
                    {config.label}: {displayValue}
                </span>
            </label>
            <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={sliderValue}
                onChange={handleSliderChange}
                className="w-full h-1.5 bg-slate rounded-full appearance-none cursor-pointer accent-neon-cyan"
            />
            <div className="flex justify-between text-[10px] text-ash font-mono">
                <span>Low Quality</span>

                <span
                    className={cn(
                        "px-1.5 py-0.5 rounded",
                        qualityLevel === "high" && "text-success-green",
                        qualityLevel === "medium" && "text-warning-amber",
                        qualityLevel === "low" && "text-error-red",
                    )}
                >
                    {config.description}
                </span>

                <span>High Quality</span>
            </div>
        </div>
    );
}

function getDisplayValue(value: number, config: FormatQualityInfo): string {
    if (config.unit) {
        return `${value} ${config.unit}`;
    }
    return `${value}`;
}

function getQualityLevel(
    value: number,
    config: FormatQualityInfo,
): "high" | "medium" | "low" {
    const range = config.max - config.min;
    const normalized = (value - config.min) / range;

    if (config.lowerIsBetter) {
        if (normalized <= 0.33) return "high";
        if (normalized <= 0.66) return "medium";
        return "low";
    } else {
        if (normalized >= 0.66) return "high";
        if (normalized >= 0.33) return "medium";
        return "low";
    }
}

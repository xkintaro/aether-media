import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}
export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = "md",
}: ToggleSwitchProps) {
  const sizes = {
    sm: {
      track: "w-8 h-4",
      thumb: "w-3 h-3",
      translate: "calc(100% - 14px)",
    },
    md: {
      track: "w-9 h-5",
      thumb: "w-4 h-4",
      translate: "calc(100% - 20px)",
    },
  };
  const s = sizes[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative rounded-full transition-colors duration-200",
        s.track,
        checked ? "bg-neon-cyan/60" : "bg-zinc",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <motion.div
        className={cn("absolute top-0.5 rounded-full bg-snow ", s.thumb)}
        animate={{
          left: checked ? s.translate : "2px",
        }}
        initial={false}
      />
    </button>
  );
}

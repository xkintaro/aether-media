import { memo } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NamingBlock } from "@/types";
import { DEFAULT_RANDOM_LENGTH } from "@/types";
import { BLOCK_DEFINITIONS } from "./blocks";

interface BlockItemProps {
  block: NamingBlock;
  onUpdate: (id: string, params: NamingBlock["params"]) => void;
  onRemove: (id: string) => void;
  isSingle: boolean;
}

export const BlockItem = memo(function BlockItem({
  block,
  onUpdate,
  onRemove,
  isSingle,
}: BlockItemProps) {
  const definition = BLOCK_DEFINITIONS.find((d) => d.type === block.type);
  const controls = useDragControls();
  if (!definition) return null;

  const Icon = definition.icon;

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      className="relative"
      style={{ listStyle: "none" }}
    >
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 select-none",
          "bg-graphite/50 border",
          isSingle
            ? "border-dashed border-border-subtle opacity-90 cursor-default"
            : "border-border-subtle group hover:border-border",
        )}
      >
        {!isSingle && (
          <div
            onPointerDown={(e) => controls.start(e)}
            className="text-ash shrink-0 group-hover:text-smoke transition-colors cursor-grab active:cursor-grabbing touch-none py-1 pr-1"
            style={{ touchAction: "none" }}
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <div
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors",
            isSingle
              ? "bg-slate/30 text-ash"
              : "bg-neon-cyan/10 text-neon-cyan",
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "text-xs font-medium block truncate transition-colors",
              isSingle ? "text-ash" : "text-smoke",
            )}
          >
            {definition.label}
          </span>
          {block.type === "prefix" && (
            <input
              type="text"
              value={block.params?.value || ""}
              onChange={(e) =>
                onUpdate(block.id, { ...block.params, value: e.target.value })
              }
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="prefix..."
              className="mt-1 w-full px-1.5 py-0.5 text-[10px] font-mono bg-slate/50 border border-border-subtle rounded text-snow focus:border-neon-cyan/50 focus:outline-none placeholder:text-ash/50 select-text"
            />
          )}
          {block.type === "random" && (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min={4}
                max={32}
                value={block.params?.length || DEFAULT_RANDOM_LENGTH}
                onChange={(e) =>
                  onUpdate(block.id, {
                    ...block.params,
                    length: parseInt(e.target.value),
                  })
                }
                onPointerDown={(e) => e.stopPropagation()}
                className="flex-1 h-1 bg-slate rounded-full appearance-none cursor-pointer accent-neon-cyan"
              />
              <span className="text-[10px] font-mono text-neon-cyan w-6 text-right">
                {block.params?.length || DEFAULT_RANDOM_LENGTH}
              </span>
            </div>
          )}
        </div>
        {!isSingle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(block.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 text-ash hover:text-plasma-pink transition-all opacity-0 group-hover:opacity-100 hover:bg-plasma-pink/10 rounded-full"
            title="Remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Reorder.Item>
  );
});

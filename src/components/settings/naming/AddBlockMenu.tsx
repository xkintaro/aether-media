import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence } from "framer-motion";
import { Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NamingBlockType } from "@/types";
import { BLOCK_DEFINITIONS } from "./blocks";

interface AddBlockMenuProps {
  availableBlocks: typeof BLOCK_DEFINITIONS;
  handleAddBlock: (type: NamingBlockType) => void;
}

export function AddBlockMenu({
  availableBlocks,
  handleAddBlock,
}: AddBlockMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          disabled={availableBlocks.length === 0}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed transition-all duration-200 group",
            availableBlocks.length === 0
              ? "border-border-subtle text-ash/50 cursor-not-allowed bg-slate/10"
              : "border-border-subtle text-ash hover:border-neon-cyan/50 hover:text-neon-cyan hover:bg-neon-cyan/5 active:scale-[0.99] data-[state=open]:border-neon-cyan/50 data-[state=open]:bg-neon-cyan/5 data-[state=open]:text-neon-cyan",
          )}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">
            {availableBlocks.length === 0 ? "All blocks added" : "Add Block"}
          </span>
          <ChevronDown className="w-4 h-4 ml-auto text-ash/50 group-data-[state=open]:rotate-180 transition-transform duration-200" />
        </button>
      </DropdownMenu.Trigger>
      <AnimatePresence>
        {availableBlocks.length > 0 && (
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={5}
              align="center"
              className={cn(
                "z-(--z-dropdown) w-(--radix-dropdown-menu-trigger-width) min-w-[220px] p-2",
                "bg-graphite/95 backdrop-blur-xl",
                "border border-border-subtle rounded-lg",
              )}
            >
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {availableBlocks.map((def) => {
                  const Icon = def.icon;
                  return (
                    <DropdownMenu.Item
                      key={def.type}
                      onSelect={() => handleAddBlock(def.type)}
                      className={cn(
                        "group flex items-start gap-3 p-2 rounded-lg cursor-pointer outline-none",
                        "data-highlighted:bg-slate/50 transition-colors duration-200",
                      )}
                    >
                      <div
                        className={cn(
                          "p-1.5 rounded bg-slate/50 text-ash transition-colors",
                          "group-data-highlighted:text-neon-cyan group-data-highlighted:bg-neon-cyan/10",
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div
                          className={cn(
                            "text-xs font-medium text-smoke transition-colors",
                            "group-data-highlighted:text-snow",
                          )}
                        >
                          {def.label}
                        </div>
                        <div className="text-[10px] text-ash/70 leading-tight mt-0.5">
                          {def.description}
                        </div>
                      </div>
                    </DropdownMenu.Item>
                  );
                })}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </AnimatePresence>
    </DropdownMenu.Root>
  );
}

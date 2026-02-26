import { useMemo, memo } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  FileText,
  Type,
  Shuffle,
  Calendar,
  Plus,
  X,
  GripVertical,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence } from "framer-motion";
import { cn, generateId } from "@/lib/utils";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import type { NamingBlock, NamingBlockType, NamingConfig } from "@/types";
import { DEFAULT_RANDOM_LENGTH } from "@/types";

interface BlockDefinition {
  type: NamingBlockType;
  label: string;
  icon: typeof FileText;
  description: string;
  defaultParams?: NamingBlock["params"];
}

const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: "original",
    label: "Original Filename",
    icon: FileText,
    description: "Use original filename",
  },
  {
    type: "prefix",
    label: "Prefix",
    icon: Type,
    description: "Add prefix text",
    defaultParams: { value: "file" },
  },
  {
    type: "random",
    label: "Random Variable",
    icon: Shuffle,
    description: "Add random characters",
    defaultParams: { length: DEFAULT_RANDOM_LENGTH },
  },
  {
    type: "date",
    label: "Date",
    icon: Calendar,
    description: "Date stamp",
  },
];

interface NamingConfigProps {
  config: NamingConfig;
  onChange: (config: NamingConfig) => void;
}

interface BlockItemProps {
  block: NamingBlock;
  onUpdate: (id: string, params: NamingBlock["params"]) => void;
  onRemove: (id: string) => void;
  isSingle: boolean;
}

const BlockItem = memo(function BlockItem({
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

export function NamingConfig({ config, onChange }: NamingConfigProps) {
  const availableBlocks = useMemo(() => {
    const usedTypes = new Set(config.blocks.map((b) => b.type));
    return BLOCK_DEFINITIONS.filter((def) => !usedTypes.has(def.type));
  }, [config.blocks]);

  const isSingleBlock = config.blocks.length === 1;

  const handleAddBlock = (type: NamingBlockType) => {
    const definition = BLOCK_DEFINITIONS.find((d) => d.type === type);
    if (!definition) return;

    const newBlock: NamingBlock = {
      id: generateId("block"),
      type,
      params: definition.defaultParams,
    };
    onChange({
      ...config,
      blocks: [...config.blocks, newBlock],
    });
  };

  const handleUpdateBlock = (
    blockId: string,
    params: NamingBlock["params"],
  ) => {
    onChange({
      ...config,
      blocks: config.blocks.map((b) =>
        b.id === blockId ? { ...b, params } : b,
      ),
    });
  };

  const handleRemoveBlock = (blockId: string) => {
    if (config.blocks.length <= 1) return;
    const newBlocks = config.blocks.filter((b) => b.id !== blockId);
    onChange({ ...config, blocks: newBlocks });
  };

  const handleReorder = (newOrder: NamingBlock[]) => {
    onChange({ ...config, blocks: newOrder });
  };

  const handleSanitizeToggle = (enabled: boolean) => {
    onChange({ ...config, sanitizeEnabled: enabled });
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-smoke">Naming Strategy</label>
      <div className="space-y-2 mb-4 mt-2">
        <Reorder.Group
          axis="y"
          values={config.blocks}
          onReorder={handleReorder}
          className="flex flex-col gap-1.5"
          layoutScroll
        >
          {config.blocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              onUpdate={handleUpdateBlock}
              onRemove={handleRemoveBlock}
              isSingle={isSingleBlock}
            />
          ))}
        </Reorder.Group>

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
                {availableBlocks.length === 0
                  ? "All blocks added"
                  : "Add Block"}
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
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-electric-violet" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-smoke">
              Clean Special Characters
            </span>
            <span className="text-[10px] text-ash">
              Removes special characters from filename
            </span>
          </div>
        </div>
        <ToggleSwitch
          checked={config.sanitizeEnabled}
          onChange={handleSanitizeToggle}
        />
      </div>
    </div>
  );
}

export default NamingConfig;

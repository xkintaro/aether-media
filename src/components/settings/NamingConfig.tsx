import { useMemo } from "react";
import { Reorder } from "framer-motion";
import { Sparkles } from "lucide-react";
import { generateId } from "@/lib/utils";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import type { NamingBlock, NamingBlockType, NamingConfig } from "@/types";
import { BLOCK_DEFINITIONS } from "./naming/blocks";
import { BlockItem } from "./naming/BlockItem";
import { AddBlockMenu } from "./naming/AddBlockMenu";

interface NamingConfigProps {
  config: NamingConfig;
  onChange: (config: NamingConfig) => void;
}

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

        <AddBlockMenu
          availableBlocks={availableBlocks}
          handleAddBlock={handleAddBlock}
        />
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

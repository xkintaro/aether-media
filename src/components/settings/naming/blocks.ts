import { FileText, Type, Shuffle, Calendar } from "lucide-react";
import type { NamingBlock, NamingBlockType } from "@/types";
import { DEFAULT_RANDOM_LENGTH } from "@/types";

interface BlockDefinition {
  type: NamingBlockType;
  label: string;
  icon: typeof FileText;
  description: string;
  defaultParams?: NamingBlock["params"];
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
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

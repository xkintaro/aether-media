export type NamingBlockType = "original" | "prefix" | "random" | "date";

export interface NamingBlock {
  id: string;
  type: NamingBlockType;
  params?: {
    value?: string;
    length?: number;
  };
}

export interface NamingConfig {
  blocks: NamingBlock[];
  sanitizeEnabled: boolean;
}

export const DEFAULT_RANDOM_LENGTH = 8;

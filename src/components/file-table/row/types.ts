import type { QueueItem } from "@/types";

export interface FileRowProps {
  item: QueueItem;
  isSelected: boolean;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onPreview: (path: string) => void;
}

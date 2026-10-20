import type { QueueItem } from "@/types";

export function rebuildIndex(items: QueueItem[]): Map<string, number> {
  const index = new Map<string, number>();
  for (let i = 0; i < items.length; i++) {
    index.set(items[i].id, i);
  }
  return index;
}

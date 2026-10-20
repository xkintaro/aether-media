import * as ContextMenu from "@radix-ui/react-context-menu";
import { FolderOpen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileRowContextMenuProps {
  isProcessing: boolean;
  handleRevealInExplorer: () => Promise<void>;
  handleDelete: () => void;
}

export function FileRowContextMenu({
  isProcessing,
  handleRevealInExplorer,
  handleDelete,
}: FileRowContextMenuProps) {
  return (
    <ContextMenu.Portal>
      <ContextMenu.Content className="context-menu-content">
        <ContextMenu.Item
          onClick={handleRevealInExplorer}
          className="context-menu-item"
        >
          <FolderOpen className="w-4 h-4 text-ash" />
          <span>Open Location</span>
        </ContextMenu.Item>
        <ContextMenu.Separator className="h-px my-1.5 bg-border-subtle" />
        <ContextMenu.Item
          onClick={handleDelete}
          disabled={isProcessing}
          className={cn(
            "context-menu-item-danger",
            isProcessing && "opacity-50 cursor-not-allowed",
          )}
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Portal>
  );
}

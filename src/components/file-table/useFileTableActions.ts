import { useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useQueueStore } from "@/store/queueStore";
import { useAppSettingsStore } from "@/store/appSettingsStore";
import { TAURI_COMMANDS } from "@/lib/constants";

export function useFileTableActions(
  allSelected: boolean,
  someSelected: boolean,
) {
  const {
    selectedIds,
    removeItems,
    selectAll,
    deselectAll,
    isProcessing,
    hasPersistedQueue,
    sessionRestoreHandled,
  } = useQueueStore();
  const { autoRestoreSession } = useAppSettingsStore();
  const isSessionRestoreActive =
    hasPersistedQueue && !sessionRestoreHandled && !autoRestoreSession;
  const handleRemove = useCallback(
    (id: string) => {
      invoke(TAURI_COMMANDS.DELETE_THUMBNAILS, { fileIds: [id] }).catch(
        console.error,
      );
      removeItems([id]);
    },
    [removeItems],
  );

  const handleCancel = useCallback((id: string) => {
    invoke(TAURI_COMMANDS.CANCEL_CONVERSION, { id }).catch(console.error);
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size > 0) {
      const ids = [...selectedIds];
      invoke(TAURI_COMMANDS.DELETE_THUMBNAILS, { fileIds: ids }).catch(
        console.error,
      );
      removeItems(ids);
    }
  }, [selectedIds, removeItems]);

  const handleToggleAll = useCallback(() => {
    if (allSelected || someSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [allSelected, someSelected, selectAll, deselectAll]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSessionRestoreActive) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        const activeElement = document.activeElement as HTMLElement;
        const isInputActive =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.isContentEditable);

        if (isInputActive) {
          return;
        }

        e.preventDefault();
        if (allSelected) {
          deselectAll();
        } else {
          selectAll();
        }
        return;
      }

      if (e.key === "Escape") {
        deselectAll();
        return;
      }

      if (e.key === "Delete") {
        if (selectedIds.size === 0 || isProcessing) return;

        const ids = [...selectedIds];
        invoke(TAURI_COMMANDS.DELETE_THUMBNAILS, { fileIds: ids }).catch(
          console.error,
        );
        removeItems(ids);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectAll,
    deselectAll,
    allSelected,
    selectedIds,
    isProcessing,
    removeItems,
    isSessionRestoreActive,
  ]);

  return { handleRemove, handleCancel, handleBulkDelete, handleToggleAll };
}

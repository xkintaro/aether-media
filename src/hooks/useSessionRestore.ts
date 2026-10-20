import { useCallback, useEffect, useRef } from "react";
import { useQueueStore } from "@/store/queueStore";
import { useToastStore } from "@/store/toastStore";
import { useAppSettingsStore } from "@/store/appSettingsStore";

export function useSessionRestore() {
  const {
    hasPersistedQueue,
    sessionRestoreHandled,
    confirmSessionRestore,
    discardSession,
  } = useQueueStore();
  const { addToast } = useToastStore();
  const handleSessionRestore = useCallback(() => {
    confirmSessionRestore();
    addToast("Previous session restored", "success");
  }, [confirmSessionRestore, addToast]);

  const handleSessionDiscard = useCallback(async () => {
    await discardSession();
    addToast("Previous session cleared", "info");
  }, [discardSession, addToast]);

  const { autoRestoreSession } = useAppSettingsStore();

  useEffect(() => {
    if (hasPersistedQueue && !sessionRestoreHandled && autoRestoreSession) {
      confirmSessionRestore();
    }
    useQueueStore.getState().validateThumbnails();
  }, [
    hasPersistedQueue,
    sessionRestoreHandled,
    autoRestoreSession,
    confirmSessionRestore,
  ]);

  const showSessionDialog =
    hasPersistedQueue && !sessionRestoreHandled && !autoRestoreSession;
  const isSessionDialogActiveRef = useRef(showSessionDialog);

  useEffect(() => {
    isSessionDialogActiveRef.current = showSessionDialog;
  }, [showSessionDialog]);

  return {
    showSessionDialog,
    isSessionDialogActiveRef,
    handleSessionRestore,
    handleSessionDiscard,
  };
}

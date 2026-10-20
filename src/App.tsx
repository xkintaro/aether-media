import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { FileToolbar } from "@/components/layout/FileToolbar";
import { FileTable } from "@/components/file-table/FileTable";
import { UploadOverlay } from "@/components/ui/UploadOverlay";
import { FileDropOverlay } from "@/components/ui/FileDropOverlay";
import { SessionRestoreDialog } from "@/components/ui/SessionRestoreDialog";
import { useQueueStore } from "@/store/queueStore";
import { useUploadStore } from "@/store/uploadStore";
import { useSettingsStore } from "@/store/settingsStore";
import { hasEffectiveOverride } from "@/lib/overrideUtils";
import { useSessionRestore } from "@/hooks/useSessionRestore";
import { useFileImport } from "@/hooks/useFileImport";
import { useFileDrop } from "@/hooks/useFileDrop";

function App() {
  const { items, clearAllOverrides, isProcessing } = useQueueStore();
  const { isUploading } = useUploadStore();
  const { settings } = useSettingsStore();
  const overrideCount = useMemo(
    () =>
      items.filter((i) => hasEffectiveOverride(i.overrideSettings, settings))
        .length,
    [items, settings],
  );

  const {
    showSessionDialog,
    isSessionDialogActiveRef,
    handleSessionRestore,
    handleSessionDiscard,
  } = useSessionRestore();
  const { handleFilePaths, handleAddFiles } = useFileImport(
    isSessionDialogActiveRef,
  );
  const isDragging = useFileDrop(handleFilePaths, isSessionDialogActiveRef);

  return (
    <div className="h-screen flex flex-col bg-void overflow-hidden noise-overlay relative">
      <ToastContainer />

      <AnimatePresence>
        {showSessionDialog && (
          <SessionRestoreDialog
            onRestore={handleSessionRestore}
            onDiscard={handleSessionDiscard}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{isUploading && <UploadOverlay />}</AnimatePresence>

      <AnimatePresence>{isDragging && <FileDropOverlay />}</AnimatePresence>

      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <FileToolbar
            overrideCount={overrideCount}
            isProcessing={isProcessing}
            clearAllOverrides={clearAllOverrides}
            handleAddFiles={handleAddFiles}
          />

          <div className="flex-1 overflow-hidden">
            <FileTable />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

import { useState, useRef } from "react";
import { Minimize2, Square, X, RotateCcw, Settings, Info } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSettingsStore } from "@/store/appSettingsStore";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { AboutModal } from "@/components/ui/AboutModal";
import { ANIMATION_DURATION, EASING, HEADER_HEIGHT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks";
import logo from "@/assets/logo.png";

export function Header() {
  const appWindow = getCurrentWindow();
  const {
    autoRestoreSession,
    setAutoRestoreSession,
    conflictMode,
    setConflictMode,
  } = useAppSettingsStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useClickOutside(settingsRef, () => setShowSettings(false), showSettings);

  return (
    <>
      <header
        data-tauri-drag-region
        style={{ height: HEADER_HEIGHT, minHeight: HEADER_HEIGHT }}
        className="z-(--z-header) flex items-center justify-between px-5 border-b border-border-subtle bg-surface-secondary/50 backdrop-blur-sm select-none relative"
      >
        <div className="flex items-center gap-2">
          <div className="relative pointer-events-none">
            <img
              src={logo}
              className="w-8 h-8"
              alt="Aether Media Logo"
              draggable={false}
            />
          </div>
          <div className="pointer-events-none">
            <h1 className="text-base font-display font-semibold text-snow tracking-tight">
              Aether Media
            </h1>
            <p className="text-[10px] text-ash font-mono uppercase tracking-wider -mt-0.5">
              Developed By Kintaro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAbout(true)}
            className="p-1.5 rounded-lg text-ash hover:text-smoke hover:bg-slate/50 transition-colors cursor-pointer active:scale-95 mr-2"
            title="About"
          >
            <Info className="w-4 h-4" />
          </button>

          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 mr-2",
                showSettings
                  ? "text-neon-cyan bg-neon-cyan/10"
                  : "text-ash hover:text-smoke hover:bg-slate/50",
              )}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{
                    duration: ANIMATION_DURATION.FAST,
                    ease: EASING.SMOOTH,
                  }}
                  className={cn(
                    "absolute right-0 top-full mt-2 w-72 z-(--z-dropdown)",
                    "glass-card bg-surface-secondary overflow-hidden",
                  )}
                >
                  <div className="px-4 py-3 border-b border-border-subtle">
                    <h3 className="text-sm font-medium text-snow">
                      Application Settings
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <p className="text-sm text-smoke">
                          Auto Restore Session
                        </p>
                        <p className="text-xs text-ash mt-0.5">
                          Automatically restore files from last session
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={autoRestoreSession}
                        onChange={setAutoRestoreSession}
                      />
                    </div>

                    <div className="h-px bg-border-subtle/50 my-2.5" />

                    <div className="flex flex-col gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-smoke">
                          Duplicate File Handling
                        </p>
                        <p className="text-xs text-ash mt-0.5">
                          Action when output file already exists
                        </p>
                      </div>
                      <div className="flex rounded-lg overflow-hidden border border-border-subtle bg-surface-primary/40">
                        {(
                          [
                            { value: "skip", label: "Skip" },
                            { value: "overwrite", label: "Overwrite" },
                            { value: "keep_both", label: "Keep Both" },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setConflictMode(opt.value)}
                            className={cn(
                              "flex-1 px-2 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                              conflictMode === opt.value
                                ? "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30"
                                : "text-ash hover:text-smoke hover:bg-white/3",
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="p-1.5 rounded-lg text-ash hover:text-smoke hover:bg-slate/50 transition-colors cursor-pointer active:scale-95 mr-2"
            title="Reload"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => appWindow.minimize()}
            className="p-1.5 rounded-lg text-ash hover:text-smoke hover:bg-slate/50 transition-colors cursor-pointer active:scale-95"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => appWindow.toggleMaximize()}
            className="p-1.5 rounded-lg text-ash hover:text-smoke hover:bg-slate/50 transition-colors cursor-pointer active:scale-95"
            title="Maximize"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => appWindow.close()}
            className="p-1.5 rounded-lg text-ash hover:text-danger-red hover:bg-danger-red/10 transition-colors cursor-pointer active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
}

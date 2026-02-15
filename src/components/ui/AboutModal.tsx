import { motion, AnimatePresence } from "framer-motion";
import { X, Github } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import logo from "@/assets/logo.png";
import { fadeIn, scaleIn } from "@/lib/animations";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 127.14 96.36"
    className={className}
    fill="currentColor"
  >
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.09,105.09,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c2.36-24.44-3.53-48.4-20.1-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  const handleOpenLink = async (url: string) => {
    try {
      await open(url);
    } catch (error) {
      console.error("Failed to open URL:", error);
      window.open(url, "_blank");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop z-(--z-modal)">
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 z-(--z-modal)"
          />

          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="modal-content z-(--z-modal)"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-ash hover:text-smoke transition-colors duration-200 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center p-8 pt-10 text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="relative mb-6 group"
              >
                <div className="absolute inset-0 bg-neon-purple/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative w-24 h-24 bg-surface-secondary rounded-full border border-border-subtle flex items-center justify-center p-4 shadow-lg overflow-hidden">
                  <img
                    src={logo}
                    alt="Aether Media"
                    className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                  />
                </div>
              </motion.div>

              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-display font-bold text-snow mb-1"
              >
                Aether Media
              </motion.h2>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-neon-cyan/80 font-mono uppercase tracking-widest mb-6"
              >
                v1.0.0
              </motion.p>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-ash mb-8 leading-relaxed max-w-xs"
              >
                The next-generation media processing tool. Enhance, convert, and
                optimize your media with the power of Aether.
              </motion.p>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-3 w-full"
              >
                <button
                  onClick={() =>
                    handleOpenLink("https://github.com/xkintaro/aether-media")
                  }
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-surface-secondary border border-border-subtle hover:bg-surface-secondary/80 hover:border-discord-blurple/50 transition-all duration-200 group cursor-pointer"
                >
                  <Github className="w-5 h-5 text-ash group-hover:text-snow transition-colors duration-200" />
                  <span className="text-sm font-medium text-ash group-hover:text-snow transition-colors duration-200">
                    GitHub
                  </span>
                </button>
                <button
                  onClick={() =>
                    handleOpenLink("https://discord.gg/NSQk27Zdkv")
                  }
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-surface-secondary border border-border-subtle hover:bg-surface-secondary/80 hover:border-discord-blurple/50 transition-all duration-200 group cursor-pointer"
                >
                  <DiscordIcon className="w-5 h-5 text-ash group-hover:text-[#5865F2] transition-colors duration-200" />
                  <span className="text-sm font-medium text-ash group-hover:text-[#5865F2] transition-colors duration-200">
                    Discord
                  </span>
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-8 pt-4 border-t border-white/5 w-full text-center"
              >
                <p className="text-[10px] text-white/20 font-mono uppercase">
                  Developed By Kintaro
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

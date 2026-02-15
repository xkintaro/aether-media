import { motion, AnimatePresence } from "framer-motion";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Trash2,
  XSquare,
} from "lucide-react";
import { useToastStore, type ToastType } from "@/store/toastStore";
import { cn } from "@/lib/utils";
import { slideUp, springTransition } from "@/lib/animations";
const iconMap: Record<ToastType, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle,
};
const styleMap: Record<ToastType, string> = {
  info: "border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan",
  warning: "border-warning-amber/30 bg-warning-amber/5 text-warning-amber",
  error: "border-danger-red/30 bg-danger-red/5 text-danger-red",
  success: "border-success-green/30 bg-success-green/5 text-success-green",
};
export function ToastContainer() {
  const { toasts, removeToast, clearAllToasts } = useToastStore();
  return (
    <div className="fixed bottom-6 right-6 z-(--z-toast) flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          return (
            <ContextMenu.Root key={toast.id}>
              <ContextMenu.Trigger asChild>
                <motion.div
                  layout
                  variants={slideUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={springTransition}
                  className={cn(
                    "pointer-events-auto flex items-center gap-3 px-4 py-3",
                    "rounded-xl border backdrop-blur-xl",
                    "bg-graphite/90 cursor-context-menu",
                    "min-w-[280px] max-w-[400px]",
                    styleMap[toast.type],
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <p className="text-sm text-smoke flex-1 font-medium">
                    {toast.message}
                  </p>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="shrink-0 p-1 rounded-lg hover:bg-white/5 transition-colors text-ash hover:text-smoke"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              </ContextMenu.Trigger>
              <ContextMenu.Portal>
                <ContextMenu.Content className="context-menu-content">
                  <ContextMenu.Item
                    onClick={() => removeToast(toast.id)}
                    className="context-menu-item"
                  >
                    <XSquare className="w-4 h-4 text-ash" />
                    <span>Close</span>
                  </ContextMenu.Item>

                  <ContextMenu.Separator className="h-px my-1.5 bg-border-subtle" />

                  <ContextMenu.Item
                    onClick={() => clearAllToasts()}
                    className="context-menu-item-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Close All</span>
                  </ContextMenu.Item>
                </ContextMenu.Content>
              </ContextMenu.Portal>
            </ContextMenu.Root>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

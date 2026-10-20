import {
  Check,
  Loader2,
  AlertCircle,
  X,
  Video,
  Image,
  Music,
} from "lucide-react";
import type { ProcessStatus, MediaType } from "@/types";

export const statusConfig: Record<
  ProcessStatus,
  {
    icon: typeof Check;
    badgeClass: string;
    label: string;
  }
> = {
  pending: { icon: Loader2, badgeClass: "badge-pending", label: "Pending" },
  processing: {
    icon: Loader2,
    badgeClass: "badge-processing",
    label: "Processing",
  },
  completed: { icon: Check, badgeClass: "badge-completed", label: "Completed" },
  error: { icon: AlertCircle, badgeClass: "badge-error", label: "Error" },
  cancelled: { icon: X, badgeClass: "badge-cancelled", label: "Cancelled" },
  conflict: {
    icon: AlertCircle,
    badgeClass: "badge-cancelled",
    label: "Conflict",
  },
};

export const mediaIcons: Record<MediaType, typeof Video> = {
  video: Video,
  image: Image,
  audio: Music,
};

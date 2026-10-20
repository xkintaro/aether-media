import type { MediaType } from "./media";
import type { ConversionSettings } from "./settings";

export type ProcessStatus =
  | "pending"
  | "processing"
  | "completed"
  | "error"
  | "cancelled"
  | "conflict";

export type ItemStatus = "completed" | "error" | "cancelled";

export type ThumbnailStatus = "pending" | "loading" | "loaded" | "error";

export interface QueueItem {
  id: string;
  inputPath: string;
  fileName: string;
  fileSize: number;
  mediaType: MediaType;
  thumbnailPath?: string;
  thumbnailStatus: ThumbnailStatus;
  status: ProcessStatus;
  progress: number;
  overrideSettings?: Partial<ConversionSettings>;
  errorMessage?: string;
  outputPath?: string;
  createdAt: number;
}

export interface ProgressEvent {
  id: string;
  progress: number;
  status: ProcessStatus;
  message?: string;
}

export interface ConversionResult {
  id: string;
  success: boolean;
  outputPath?: string;
  errorMessage?: string;
}

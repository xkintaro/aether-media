export const ROW_HEIGHT = 76;
export const EXPANDED_ROW_HEIGHT = 320;
export const TOOLBAR_HEIGHT = 80;
export const HEADER_HEIGHT = 56;
export const SIDEBAR_WIDTH = 320;

export const TOAST_DEFAULT_DURATION = 4000;

export const LAZY_LOAD_MARGIN = 50;
export const LAZY_LOAD_DELAY = 300;
export const VIRTUAL_OVERSCAN = 3;

export const ANIMATION_DURATION = {
  FAST: 0.15,
  NORMAL: 0.25,
  SLOW: 0.4,
  SLOWER: 0.5,
} as const;

export const CHUNK_SIZE = 50;
export const PROCESS_DEBUG_DELAY = 10;

export const EASING = {
  SPRING: [0.34, 1.56, 0.64, 1],
  SMOOTH: [0.16, 1, 0.3, 1],
  EASE_OUT: [0.4, 0, 0.2, 1],
} as const;

export const SPRING_CONFIG = {
  DEFAULT: { type: "spring", stiffness: 400, damping: 30 },
  SOFT: { type: "spring", stiffness: 300, damping: 25 },
  STIFF: { type: "spring", stiffness: 500, damping: 30 },
} as const;

export const SCROLL_VELOCITY_THRESHOLD = 2.5;
export const SCROLL_DEBOUNCE_MS = 1000;

export const TAURI_COMMANDS = {
  GET_FILES_INFO_BATCH: "get_files_info_batch",
  GET_FILE_INFO: "get_file_info",
  GENERATE_THUMBNAIL: "generate_thumbnail",
  GENERATE_THUMBNAILS_BATCH: "generate_thumbnails_batch",
  DELETE_THUMBNAILS: "delete_thumbnails",
  CLEANUP_ALL_TEMP_THUMBNAILS: "cleanup_all_temp_thumbnails",
  CANCEL_CONVERSION: "cancel_conversion",
  CONVERT_FILE: "convert_file",
  CHECK_FILE_EXISTS: "check_file_exists",
} as const;

export const TAURI_EVENTS = {
  DRAG_ENTER: "tauri://drag-enter",
  DRAG_LEAVE: "tauri://drag-leave",
  DRAG_DROP: "tauri://drag-drop",
} as const;

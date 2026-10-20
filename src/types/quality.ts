export interface FormatQualityInfo {
  min: number;
  max: number;
  default: number;
  step: number;
  label: string;
  unit: string;
  description: string;
  lowerIsBetter: boolean;
  isLossless?: boolean;
}

export const FORMAT_QUALITY_CONFIG: Record<string, FormatQualityInfo> = {
  // Video
  mp4: {
    min: 18,
    max: 51,
    default: 23,
    step: 1,
    label: "CRF",
    unit: "",
    description: "Lower = higher quality",
    lowerIsBetter: true,
  },
  mkv: {
    min: 18,
    max: 51,
    default: 23,
    step: 1,
    label: "CRF",
    unit: "",
    description: "Lower = higher quality",
    lowerIsBetter: true,
  },
  mov: {
    min: 18,
    max: 51,
    default: 23,
    step: 1,
    label: "CRF",
    unit: "",
    description: "Lower = higher quality",
    lowerIsBetter: true,
  },
  webm: {
    min: 24,
    max: 63,
    default: 31,
    step: 1,
    label: "CRF",
    unit: "",
    description: "Lower = higher quality",
    lowerIsBetter: true,
  },
  // Image
  jpg: {
    min: 2,
    max: 31,
    default: 5,
    step: 1,
    label: "Quality",
    unit: "",
    description: "Lower = higher quality",
    lowerIsBetter: true,
  },
  webp: {
    min: 1,
    max: 100,
    default: 80,
    step: 1,
    label: "Quality",
    unit: "",
    description: "Higher = higher quality",
    lowerIsBetter: false,
  },
  png: {
    min: 0,
    max: 0,
    default: 0,
    step: 0,
    label: "Lossless",
    unit: "",
    description: "No quality setting needed",
    lowerIsBetter: false,
    isLossless: true,
  },
  // Audio
  mp3: {
    min: 0,
    max: 9,
    default: 2,
    step: 1,
    label: "VBR Quality",
    unit: "",
    description: "Lower = higher quality",
    lowerIsBetter: true,
  },
  aac: {
    min: 128,
    max: 320,
    default: 192,
    step: 8,
    label: "Bitrate",
    unit: "kbps",
    description: "Higher = higher quality",
    lowerIsBetter: false,
  },
  m4a: {
    min: 128,
    max: 320,
    default: 192,
    step: 8,
    label: "Bitrate",
    unit: "kbps",
    description: "Higher = higher quality",
    lowerIsBetter: false,
  },
  ogg: {
    min: 1,
    max: 8,
    default: 6,
    step: 1,
    label: "Quality",
    unit: "",
    description: "Higher = higher quality",
    lowerIsBetter: false,
  },
};

export function getQualityConfigForFormat(
  format: string | null,
): FormatQualityInfo | null {
  if (!format) return null;
  const lower = format.toLowerCase();
  if (FORMAT_QUALITY_CONFIG[lower]) {
    return FORMAT_QUALITY_CONFIG[lower];
  }
  if (lower === "jpeg") return FORMAT_QUALITY_CONFIG["jpg"];

  return null;
}

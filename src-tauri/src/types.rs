use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum VideoFormat {
    Mp4,
    Mkv,
    Mov,
    Webm,
    Avi,
    Wmv,
    M4v,
    Flv,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ImageFormat {
    Jpg,
    Png,
    Webp,
    Bmp,
    Tiff,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AudioFormat {
    Mp3,
    Wav,
    Aac,
    Flac,
    M4a,
    Ogg,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum OutputFormat {
    Video(VideoFormat),
    Image(ImageFormat),
    Audio(AudioFormat),
}

impl OutputFormat {
    pub fn extension(&self) -> &str {
        match self {
            OutputFormat::Video(v) => match v {
                VideoFormat::Mp4 => "mp4",
                VideoFormat::Mkv => "mkv",
                VideoFormat::Mov => "mov",
                VideoFormat::Webm => "webm",
                VideoFormat::Avi => "avi",
                VideoFormat::Wmv => "wmv",
                VideoFormat::M4v => "m4v",
                VideoFormat::Flv => "flv",
            },
            OutputFormat::Image(i) => match i {
                ImageFormat::Jpg => "jpg",
                ImageFormat::Png => "png",
                ImageFormat::Webp => "webp",
                ImageFormat::Bmp => "bmp",
                ImageFormat::Tiff => "tiff",
            },
            OutputFormat::Audio(a) => match a {
                AudioFormat::Mp3 => "mp3",
                AudioFormat::Wav => "wav",
                AudioFormat::Aac => "aac",
                AudioFormat::Flac => "flac",
                AudioFormat::M4a => "m4a",
                AudioFormat::Ogg => "ogg",
            },
        }
    }

    pub fn supports_transparency(&self) -> bool {
        matches!(
            self,
            OutputFormat::Image(ImageFormat::Png | ImageFormat::Webp)
                | OutputFormat::Video(VideoFormat::Webm)
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MediaType {
    Video,
    Image,
    Audio,
}

impl MediaType {
    pub fn from_extension(extension: &str) -> Option<Self> {
        match extension.to_lowercase().as_str() {
            "mp4" | "mkv" | "mov" | "webm" | "avi" | "wmv" | "m4v" | "flv" => {
                Some(MediaType::Video)
            }
            "jpg" | "jpeg" | "png" | "webp" | "bmp" | "tiff" => Some(MediaType::Image),
            "mp3" | "wav" | "aac" | "flac" | "m4a" | "ogg" => Some(MediaType::Audio),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ResizeMode {
    Fill,
    Cover,
    Contain,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum BackgroundColor {
    Transparent,
    Black,
    White,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum NamingBlock {
    Original,
    Prefix { value: String },
    Random { length: u8 },
    Date,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ResizeConfig {
    pub width: u32,
    pub height: u32,
    pub mode: ResizeMode,
    pub background_color: BackgroundColor,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct NamingConfig {
    pub blocks: Vec<NamingBlock>,
    pub sanitize_enabled: bool,
}

impl Default for NamingConfig {
    fn default() -> Self {
        Self {
            blocks: vec![NamingBlock::Original],
            sanitize_enabled: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ConversionRequest {
    pub id: String,
    pub input_path: String,
    pub output_format: String,
    pub quality_percent: u8,
    pub strip_metadata: bool,
    pub is_muted: bool,
    pub resize_config: Option<ResizeConfig>,
    pub naming_config: Option<NamingConfig>,
    pub output_directory: Option<String>,
    pub conflict_mode: String,
    #[serde(default = "default_processing_enabled")]
    pub processing_enabled: bool,
}

fn default_processing_enabled() -> bool {
    true
}

#[derive(Debug, Clone)]
pub struct ConversionConfig {
    pub input_path: PathBuf,
    pub output_path: PathBuf,
    pub output_format: OutputFormat,
    pub quality_percent: u8,
    pub resize_config: Option<ResizeConfig>,
    pub is_muted: bool,
    pub strip_metadata: bool,
    pub conflict_mode: String,
}

impl ConversionConfig {
    pub fn calculate_crf(&self) -> u8 {
        match &self.output_format {
            OutputFormat::Video(VideoFormat::Webm) => {
                let crf = 63.0 - ((self.quality_percent as f32 / 100.0) * 32.0);
                crf.clamp(31.0, 63.0) as u8
            }
            OutputFormat::Video(VideoFormat::Mp4) | OutputFormat::Video(VideoFormat::Mkv) => {
                let crf = 51.0 - ((self.quality_percent as f32 / 100.0) * 28.0);
                crf.clamp(23.0, 51.0) as u8
            }
            OutputFormat::Video(VideoFormat::Mov) => {
                let crf = 51.0 - ((self.quality_percent as f32 / 100.0) * 28.0);
                crf.clamp(23.0, 51.0) as u8
            }
            OutputFormat::Video(VideoFormat::Avi) => {
                let qscale = 31.0 - ((self.quality_percent as f32 / 100.0) * 28.0);
                qscale.clamp(3.0, 31.0) as u8
            }
            OutputFormat::Video(VideoFormat::Wmv) => {
                let qscale = 31.0 - ((self.quality_percent as f32 / 100.0) * 28.0);
                qscale.clamp(3.0, 31.0) as u8
            }
            OutputFormat::Video(VideoFormat::M4v) => {
                let crf = 51.0 - ((self.quality_percent as f32 / 100.0) * 28.0);
                crf.clamp(23.0, 51.0) as u8
            }
            OutputFormat::Video(VideoFormat::Flv) => {
                let crf = 51.0 - ((self.quality_percent as f32 / 100.0) * 28.0);
                crf.clamp(23.0, 51.0) as u8
            }
            _ => {
                let crf = 51.0 - (self.quality_percent as f32 * 0.28);
                crf.clamp(23.0, 51.0) as u8
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ProcessStatus {
    Pending,
    Processing,
    Completed,
    Error,
    Cancelled,
    Conflict,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressEvent {
    pub id: String,
    pub progress: u8,
    pub status: ProcessStatus,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversionResult {
    pub id: String,
    pub success: bool,
    pub output_path: Option<PathBuf>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ThumbnailRequest {
    pub id: String,
    pub input_path: PathBuf,
    pub media_type: MediaType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThumbnailResult {
    pub id: String,
    pub thumbnail_path: Option<PathBuf>,
    pub success: bool,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub media_type: MediaType,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInfoResult {
    pub path: String,
    pub info: Option<FileInfo>,
    pub error: Option<String>,
}

pub fn parse_output_format(s: &str) -> Option<OutputFormat> {
    match s.to_lowercase().as_str() {
        "mp4" => Some(OutputFormat::Video(VideoFormat::Mp4)),
        "mkv" => Some(OutputFormat::Video(VideoFormat::Mkv)),
        "mov" => Some(OutputFormat::Video(VideoFormat::Mov)),
        "webm" => Some(OutputFormat::Video(VideoFormat::Webm)),
        "avi" => Some(OutputFormat::Video(VideoFormat::Avi)),
        "wmv" => Some(OutputFormat::Video(VideoFormat::Wmv)),
        "m4v" => Some(OutputFormat::Video(VideoFormat::M4v)),
        "flv" => Some(OutputFormat::Video(VideoFormat::Flv)),
        "jpg" | "jpeg" => Some(OutputFormat::Image(ImageFormat::Jpg)),
        "png" => Some(OutputFormat::Image(ImageFormat::Png)),
        "webp" => Some(OutputFormat::Image(ImageFormat::Webp)),
        "bmp" => Some(OutputFormat::Image(ImageFormat::Bmp)),
        "tiff" => Some(OutputFormat::Image(ImageFormat::Tiff)),
        "mp3" => Some(OutputFormat::Audio(AudioFormat::Mp3)),
        "wav" => Some(OutputFormat::Audio(AudioFormat::Wav)),
        "aac" => Some(OutputFormat::Audio(AudioFormat::Aac)),
        "flac" => Some(OutputFormat::Audio(AudioFormat::Flac)),
        "m4a" => Some(OutputFormat::Audio(AudioFormat::M4a)),
        "ogg" => Some(OutputFormat::Audio(AudioFormat::Ogg)),
        _ => None,
    }
}

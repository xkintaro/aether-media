use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum VideoFormat {
    Mp4,
    Mkv,
    Mov,
    Webm,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ImageFormat {
    Jpg,
    Png,
    Webp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AudioFormat {
    Mp3,
    Aac,
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
            },
            OutputFormat::Image(i) => match i {
                ImageFormat::Jpg => "jpg",
                ImageFormat::Png => "png",
                ImageFormat::Webp => "webp",
            },
            OutputFormat::Audio(a) => match a {
                AudioFormat::Mp3 => "mp3",
                AudioFormat::Aac => "aac",
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
            "mp4" | "mkv" | "mov" | "webm" | "avi" | "wmv" | "flv" | "m4v" => {
                Some(MediaType::Video)
            }
            "jpg" | "jpeg" | "png" | "webp" | "bmp" | "tiff" | "tif" => Some(MediaType::Image),
            "mp3" | "aac" | "m4a" | "ogg" | "wav" | "flac" | "wma" | "opus" => {
                Some(MediaType::Audio)
            }
            _ => None,
        }
    }
}

pub fn parse_output_format(s: &str) -> Option<OutputFormat> {
    match s.to_lowercase().as_str() {
        "mp4" => Some(OutputFormat::Video(VideoFormat::Mp4)),
        "mkv" => Some(OutputFormat::Video(VideoFormat::Mkv)),
        "mov" => Some(OutputFormat::Video(VideoFormat::Mov)),
        "webm" => Some(OutputFormat::Video(VideoFormat::Webm)),
        "jpg" | "jpeg" => Some(OutputFormat::Image(ImageFormat::Jpg)),
        "png" => Some(OutputFormat::Image(ImageFormat::Png)),
        "webp" => Some(OutputFormat::Image(ImageFormat::Webp)),
        "mp3" => Some(OutputFormat::Audio(AudioFormat::Mp3)),
        "aac" => Some(OutputFormat::Audio(AudioFormat::Aac)),
        "m4a" => Some(OutputFormat::Audio(AudioFormat::M4a)),
        "ogg" => Some(OutputFormat::Audio(AudioFormat::Ogg)),
        _ => None,
    }
}

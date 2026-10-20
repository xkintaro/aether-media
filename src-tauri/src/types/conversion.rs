use super::media::OutputFormat;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

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
    pub quality_value: u16,
    pub strip_metadata: bool,
    pub is_muted: bool,
    pub resize_config: Option<ResizeConfig>,
    pub naming_config: Option<NamingConfig>,
    pub output_directory: Option<String>,
    pub conflict_mode: String,
    #[serde(default = "default_processing_enabled")]
    pub processing_enabled: bool,
    pub max_bitrate: Option<u64>,
    pub video_preset: Option<String>,
}

fn default_processing_enabled() -> bool {
    true
}

#[derive(Debug, Clone)]
pub struct ConversionConfig {
    pub input_path: PathBuf,
    pub output_path: PathBuf,
    pub output_format: OutputFormat,
    pub quality_value: u16,
    pub resize_config: Option<ResizeConfig>,
    pub is_muted: bool,
    pub strip_metadata: bool,
    pub conflict_mode: String,
    pub max_bitrate: Option<u64>,
    pub video_preset: String,
}

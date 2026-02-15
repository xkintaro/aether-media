use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "details")]
pub enum ConversionError {
    FileConflict {
        path: String,
    },

    FileNotFound {
        path: String,
    },

    UnsupportedFormat {
        input: String,
        output: String,
        reason: String,
    },

    ProcessError {
        tool: String,
        exit_code: Option<i32>,
        stderr: String,
    },

    Cancelled {
        id: String,
    },

    IoError {
        message: String,
    },

    InvalidConfig {
        message: String,
    },

    ThumbnailError {
        message: String,
    },

    Unknown {
        message: String,
    },
}

impl fmt::Display for ConversionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConversionError::FileConflict { path } => {
                write!(f, "File already exists: {}", path)
            }
            ConversionError::FileNotFound { path } => {
                write!(f, "File not found: {}", path)
            }
            ConversionError::UnsupportedFormat {
                input,
                output,
                reason,
            } => {
                write!(
                    f,
                    "Unsupported format: {} -> {} ({})",
                    input, output, reason
                )
            }
            ConversionError::ProcessError {
                tool,
                exit_code,
                stderr,
            } => {
                write!(
                    f,
                    "{} error (code: {:?}): {}",
                    tool,
                    exit_code,
                    stderr.lines().next().unwrap_or("Unknown error")
                )
            }
            ConversionError::Cancelled { id } => {
                write!(f, "Process cancelled: {}", id)
            }
            ConversionError::IoError { message } => {
                write!(f, "IO error: {}", message)
            }
            ConversionError::InvalidConfig { message } => {
                write!(f, "Invalid configuration: {}", message)
            }
            ConversionError::ThumbnailError { message } => {
                write!(f, "Thumbnail error: {}", message)
            }
            ConversionError::Unknown { message } => {
                write!(f, "Unknown error: {}", message)
            }
        }
    }
}

impl std::error::Error for ConversionError {}

impl From<std::io::Error> for ConversionError {
    fn from(err: std::io::Error) -> Self {
        ConversionError::IoError {
            message: err.to_string(),
        }
    }
}

impl From<ConversionError> for String {
    fn from(err: ConversionError) -> Self {
        err.to_string()
    }
}

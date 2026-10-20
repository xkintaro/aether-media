mod builder;
mod encoding;
mod progress;
mod resize;

#[cfg(test)]
mod tests;

use builder::FFmpegCommandBuilder;
pub use encoding::{build_audio_extract_args, build_video_args};
pub use progress::{parse_duration, parse_progress};
use std::ffi::OsString;
use std::path::Path;

pub fn build_thumbnail_args(input_path: &Path, output_path: &Path) -> Vec<OsString> {
    FFmpegCommandBuilder::new()
        .arg("-ss", "00:00:01")
        .input(input_path)
        .arg("-vframes", "1")
        .arg("-q:v", "5")
        .filter_complex("scale=240:-1".to_string())
        .overwrite(true)
        .output(output_path)
        .build()
}

use crate::modules::ffmpeg;
use std::env;
use std::ffi::OsString;
use std::path::PathBuf;

pub fn get_thumbnail_path(file_id: &str) -> PathBuf {
    let temp_dir = env::temp_dir();
    temp_dir.join(format!("aether_thumb_{}.jpg", file_id))
}

pub fn get_video_thumbnail_args(input_path: &str, file_id: &str) -> (Vec<OsString>, PathBuf) {
    let output_path = get_thumbnail_path(file_id);
    let args = ffmpeg::build_thumbnail_args(std::path::Path::new(input_path), &output_path);
    (args, output_path)
}

pub fn get_image_thumbnail_args(input_path: &str, file_id: &str) -> (Vec<OsString>, PathBuf) {
    let output_path = get_thumbnail_path(file_id);
    let args = ffmpeg::build_image_thumbnail_args(std::path::Path::new(input_path), &output_path);
    (args, output_path)
}

const THUMB_PREFIX: &str = "aether_thumb_";
const THUMB_EXT: &str = ".jpg";

pub async fn cleanup_all_temp_thumbnails() {
    let temp_dir = env::temp_dir();
    if let Ok(mut entries) = tokio::fs::read_dir(&temp_dir).await {
        while let Ok(Some(entry)) = entries.next_entry().await {
            let path = entry.path();
            if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                if file_name.starts_with(THUMB_PREFIX) && file_name.ends_with(THUMB_EXT) {
                    let _ = tokio::fs::remove_file(path).await;
                }
            }
        }
    }
}

pub async fn delete_thumbnail(file_id: &str) -> std::io::Result<()> {
    let path = get_thumbnail_path(file_id);
    if path.exists() {
        tokio::fs::remove_file(path).await?;
    }
    Ok(())
}

pub async fn delete_thumbnails(file_ids: &[String]) -> Vec<String> {
    let mut failed = Vec::new();
    for id in file_ids {
        if delete_thumbnail(id).await.is_err() {
            failed.push(id.clone());
        }
    }
    failed
}

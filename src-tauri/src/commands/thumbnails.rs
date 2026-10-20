#[cfg(windows)]
use super::sidecars::CREATE_NO_WINDOW;
use super::sidecars::{get_ffmpeg_path, get_magick_path};
use crate::modules::thumbnail;
use crate::types::{MediaType, ThumbnailRequest, ThumbnailResult};
use tauri::AppHandle;
use tokio::process::Command;

#[tauri::command]
pub async fn generate_thumbnail(
    _app: AppHandle,
    request: ThumbnailRequest,
) -> Result<ThumbnailResult, String> {
    generate_single_thumbnail(request).await
}

async fn generate_single_thumbnail(request: ThumbnailRequest) -> Result<ThumbnailResult, String> {
    match request.media_type {
        MediaType::Video => {
            let (args, output_path) = thumbnail::get_video_thumbnail_args(
                &request.input_path.to_string_lossy(),
                &request.id,
            );
            let sidecar_path = get_ffmpeg_path()?;
            let mut cmd = Command::new(&sidecar_path);
            cmd.args(&args);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            let output = cmd
                .output()
                .await
                .map_err(|e| format!("Failed to generate thumbnail: {}", e))?;
            if output.status.success() && output_path.exists() {
                Ok(ThumbnailResult {
                    id: request.id,
                    thumbnail_path: Some(output_path),
                    success: true,
                    error_message: None,
                })
            } else {
                Ok(ThumbnailResult {
                    id: request.id,
                    thumbnail_path: None,
                    success: false,
                    error_message: Some("FFmpeg thumbnail generation failed".to_string()),
                })
            }
        }
        MediaType::Image => {
            let (args, output_path) = thumbnail::get_image_thumbnail_args(
                &request.input_path.to_string_lossy(),
                &request.id,
            );
            let sidecar_path = get_magick_path()?;
            let mut cmd = Command::new(&sidecar_path);
            cmd.args(&args);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            let output = cmd
                .output()
                .await
                .map_err(|e| format!("Failed to generate thumbnail: {}", e))?;
            if output.status.success() && output_path.exists() {
                Ok(ThumbnailResult {
                    id: request.id,
                    thumbnail_path: Some(output_path),
                    success: true,
                    error_message: None,
                })
            } else {
                Ok(ThumbnailResult {
                    id: request.id,
                    thumbnail_path: None,
                    success: false,
                    error_message: Some("ImageMagick thumbnail generation failed".to_string()),
                })
            }
        }
        MediaType::Audio => Ok(ThumbnailResult {
            id: request.id,
            thumbnail_path: None,
            success: true,
            error_message: None,
        }),
    }
}

const MAX_CONCURRENT_THUMBNAILS: usize = 3;

#[tauri::command]
pub async fn generate_thumbnails_batch(
    _app: AppHandle,
    requests: Vec<ThumbnailRequest>,
) -> Result<Vec<ThumbnailResult>, String> {
    use futures::stream::{self, StreamExt};
    use std::sync::Arc;
    use tokio::sync::Semaphore;

    let semaphore = Arc::new(Semaphore::new(MAX_CONCURRENT_THUMBNAILS));

    let results: Vec<ThumbnailResult> = stream::iter(requests)
        .map(|req| {
            let sem = Arc::clone(&semaphore);
            let req_id = req.id.clone();
            async move {
                let _permit = sem.acquire().await.ok();
                generate_single_thumbnail(req)
                    .await
                    .unwrap_or_else(|e| ThumbnailResult {
                        id: req_id,
                        thumbnail_path: None,
                        success: false,
                        error_message: Some(e),
                    })
            }
        })
        .buffer_unordered(MAX_CONCURRENT_THUMBNAILS)
        .collect()
        .await;

    Ok(results)
}

#[tauri::command]
pub async fn delete_thumbnails(file_ids: Vec<String>) -> Result<Vec<String>, String> {
    let failed = thumbnail::delete_thumbnails(&file_ids).await;
    Ok(failed)
}

#[tauri::command]
pub async fn cleanup_all_temp_thumbnails() -> Result<(), String> {
    thumbnail::cleanup_all_temp_thumbnails().await;
    Ok(())
}

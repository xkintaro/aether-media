use super::super::sidecars::get_magick_path;
#[cfg(windows)]
use super::super::sidecars::CREATE_NO_WINDOW;
use crate::modules::imagemagick;
use crate::state::AppState;
use crate::types::{ConversionConfig, ConversionResult, ProcessStatus, ProgressEvent};
use std::path::Path;
use std::process::Stdio;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

pub(super) async fn convert_image_with_magick(
    app: &AppHandle,
    state: &State<'_, AppState>,
    file_id: &str,
    config: &ConversionConfig,
    final_output_path: &Path,
) -> Result<ConversionResult, String> {
    let args = imagemagick::build_image_convert_args(config);
    let sidecar_path = get_magick_path()?;

    let mut cmd = Command::new(&sidecar_path);
    cmd.args(&args);
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::piped());

    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn ImageMagick: {}", e))?;

    let stderr = child.stderr.take();

    state.register_process(file_id.to_string(), child).await;

    state
        .register_output_path(file_id.to_string(), final_output_path.to_path_buf())
        .await;

    let _ = app.emit(
        "conversion-progress",
        ProgressEvent {
            id: file_id.to_string(),
            progress: 0,
            status: ProcessStatus::Processing,
            message: Some("Processing with ImageMagick...".to_string()),
        },
    );

    let stderr_content = if let Some(stderr) = stderr {
        let mut reader = BufReader::new(stderr).lines();
        let mut lines = Vec::new();
        while let Ok(Some(line)) = reader.next_line().await {
            lines.push(line);
        }
        lines.join("\n")
    } else {
        String::new()
    };

    if let Some(mut child) = state.remove_process(file_id).await {
        let status = child
            .wait()
            .await
            .map_err(|e| format!("Failed to wait on ImageMagick: {}", e))?;

        if status.success() {
            state.remove_output_path(file_id).await;

            let _ = app.emit(
                "conversion-complete",
                ConversionResult {
                    id: file_id.to_string(),
                    success: true,
                    output_path: Some(final_output_path.to_path_buf()),
                    error_message: None,
                },
            );
            Ok(ConversionResult {
                id: file_id.to_string(),
                success: true,
                output_path: Some(final_output_path.to_path_buf()),
                error_message: None,
            })
        } else {
            if let Some(partial_path) = state.remove_output_path(file_id).await {
                if partial_path.exists() {
                    let _ = tokio::fs::remove_file(&partial_path).await;
                }
            }

            let err_msg = if stderr_content.contains("Permission denied") {
                "Conversion failed: Permission denied writing to output.".to_string()
            } else if stderr_content.contains("No space left on device") {
                "Conversion failed: Disk full.".to_string()
            } else if stderr_content.is_empty() {
                format!("ImageMagick exited with code: {:?}", status.code())
            } else {
                format!(
                    "ImageMagick exited with code: {:?}\n{}",
                    status.code(),
                    stderr_content
                )
            };

            let _ = app.emit(
                "conversion-complete",
                ConversionResult {
                    id: file_id.to_string(),
                    success: false,
                    output_path: None,
                    error_message: Some(err_msg.clone()),
                },
            );
            Err(err_msg)
        }
    } else {
        let _ = app.emit(
            "conversion-progress",
            ProgressEvent {
                id: file_id.to_string(),
                progress: 0,
                status: ProcessStatus::Cancelled,
                message: Some("Cancelled by user".to_string()),
            },
        );
        Err("Conversion cancelled".to_string())
    }
}

use super::super::sidecars::get_ffmpeg_path;
#[cfg(windows)]
use super::super::sidecars::CREATE_NO_WINDOW;
use crate::modules::ffmpeg;
use crate::state::AppState;
use crate::types::{ConversionResult, ProcessStatus, ProgressEvent};
use std::collections::VecDeque;
use std::ffi::OsString;
use std::path::PathBuf;
use std::process::Stdio;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

pub(super) async fn convert_video_or_audio(
    app: &AppHandle,
    state: &State<'_, AppState>,
    file_id: String,
    args: Vec<OsString>,
    final_output_path: PathBuf,
) -> Result<ConversionResult, String> {
    let sidecar_path = get_ffmpeg_path()?;
    let mut cmd = Command::new(&sidecar_path);
    cmd.args(&args);
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::piped());

    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn ffmpeg: {}", e))?;

    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;

    state.register_process(file_id.clone(), child).await;

    state
        .register_output_path(file_id.clone(), final_output_path.clone())
        .await;

    let _ = app.emit(
        "conversion-progress",
        ProgressEvent {
            id: file_id.clone(),
            progress: 0,
            status: ProcessStatus::Processing,
            message: Some("Processing...".to_string()),
        },
    );

    let mut reader = BufReader::new(stderr).lines();
    let mut duration_secs: Option<f64> = None;
    let mut last_emit = std::time::Instant::now();
    let mut last_log_lines: VecDeque<String> = VecDeque::with_capacity(20);

    while let Ok(Some(line)) = reader.next_line().await {
        if last_log_lines.len() >= 20 {
            last_log_lines.pop_front();
        }
        last_log_lines.push_back(line.clone());

        if duration_secs.is_none() {
            if let Some(d) = ffmpeg::parse_duration(&line) {
                duration_secs = Some(d);
            }
        }

        if let Some(progress) = ffmpeg::parse_progress(&line, duration_secs) {
            if last_emit.elapsed() >= std::time::Duration::from_millis(100) {
                let _ = app.emit(
                    "conversion-progress",
                    ProgressEvent {
                        id: file_id.clone(),
                        progress,
                        status: ProcessStatus::Processing,
                        message: None,
                    },
                );
                last_emit = std::time::Instant::now();
            }
        }
    }

    if let Some(mut child) = state.remove_process(&file_id).await {
        let status = child
            .wait()
            .await
            .map_err(|e| format!("Failed to wait on child: {}", e))?;

        if status.success() {
            state.remove_output_path(&file_id).await;

            let _ = app.emit(
                "conversion-complete",
                ConversionResult {
                    id: file_id.clone(),
                    success: true,
                    output_path: Some(final_output_path.clone()),
                    error_message: None,
                },
            );
            Ok(ConversionResult {
                id: file_id,
                success: true,
                output_path: Some(final_output_path),
                error_message: None,
            })
        } else {
            if let Some(partial_path) = state.remove_output_path(&file_id).await {
                if partial_path.exists() {
                    let _ = tokio::fs::remove_file(&partial_path).await;
                }
            }

            let log_content: String = last_log_lines.make_contiguous().join("\n");
            let err_msg = if log_content.contains("Output file does not contain any stream") {
                "Conversion failed: Input file has no suitable audio stream.".to_string()
            } else if log_content.contains("Permission denied") {
                "Conversion failed: Permission denied writing to output.".to_string()
            } else if log_content.contains("No space left on device") {
                "Conversion failed: Disk full.".to_string()
            } else {
                format!(
                    "FFmpeg exited with code: {:?}\n{}",
                    status.code(),
                    log_content
                )
            };

            let _ = app.emit(
                "conversion-complete",
                ConversionResult {
                    id: file_id.clone(),
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
                id: file_id.clone(),
                progress: 0,
                status: ProcessStatus::Cancelled,
                message: Some("Cancelled by user".to_string()),
            },
        );
        Err("Conversion cancelled".to_string())
    }
}

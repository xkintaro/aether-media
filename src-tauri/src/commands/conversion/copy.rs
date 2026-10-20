use crate::state::AppState;
use crate::types::{ConversionResult, ProcessStatus, ProgressEvent};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, State};

pub(super) async fn copy_file(
    app: &AppHandle,
    state: &State<'_, AppState>,
    file_id: String,
    input_path: PathBuf,
    final_output_path: PathBuf,
) -> Result<ConversionResult, String> {
    state
        .register_output_path(file_id.clone(), final_output_path.clone())
        .await;

    let _ = app.emit(
        "conversion-progress",
        ProgressEvent {
            id: file_id.clone(),
            progress: 0,
            status: ProcessStatus::Processing,
            message: Some("Renaming/Copying...".to_string()),
        },
    );

    match tokio::fs::copy(&input_path, &final_output_path).await {
        Ok(_) => {
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
            return Ok(ConversionResult {
                id: file_id,
                success: true,
                output_path: Some(final_output_path),
                error_message: None,
            });
        }
        Err(e) => {
            state.remove_output_path(&file_id).await;
            let err_msg = format!("Failed to copy file: {}", e);
            let _ = app.emit(
                "conversion-complete",
                ConversionResult {
                    id: file_id.clone(),
                    success: false,
                    output_path: None,
                    error_message: Some(err_msg.clone()),
                },
            );
            return Err(err_msg);
        }
    }
}

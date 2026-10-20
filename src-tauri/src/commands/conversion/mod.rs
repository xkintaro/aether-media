mod copy;
mod image;
mod output_path;
mod video;

use crate::error::ConversionError;
use crate::modules::ffmpeg;
use crate::state::AppState;
use crate::types::{
    parse_output_format, ConversionConfig, ConversionRequest, ConversionResult, OutputFormat,
};
use image::convert_image_with_magick;
use output_path::calculate_output_path;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn convert_file(
    app: AppHandle,
    state: State<'_, AppState>,
    request: ConversionRequest,
) -> Result<ConversionResult, String> {
    let file_id = request.id.clone();
    let input_path = PathBuf::from(&request.input_path);

    if !tokio::fs::try_exists(&input_path).await.unwrap_or(false) {
        return Err(ConversionError::FileNotFound {
            path: request.input_path.clone(),
        }
        .to_string());
    }

    let output_format = parse_output_format(&request.output_format)
        .ok_or_else(|| format!("Unsupported output format: {}", request.output_format))?;

    let output_path = calculate_output_path(
        &input_path,
        &output_format,
        request.output_directory.as_deref(),
        request.naming_config.as_ref(),
    );

    let final_output_path = if !request.processing_enabled {
        if let Some(stem) = output_path.file_stem() {
            let ext = input_path.extension().unwrap_or_default().to_string_lossy();
            output_path.with_file_name(format!("{}.{}", stem.to_string_lossy(), ext))
        } else {
            output_path.clone()
        }
    } else {
        output_path.clone()
    };

    let final_output_path = if tokio::fs::try_exists(&final_output_path)
        .await
        .unwrap_or(false)
    {
        match request.conflict_mode.as_str() {
            "overwrite" => final_output_path,
            "keep_both" => {
                let stem = final_output_path
                    .file_stem()
                    .map(|s| s.to_string_lossy().to_string())
                    .unwrap_or_else(|| "output".to_string());
                let ext = final_output_path
                    .extension()
                    .map(|s| s.to_string_lossy().to_string())
                    .unwrap_or_default();
                let parent = final_output_path
                    .parent()
                    .unwrap_or(Path::new("."))
                    .to_path_buf();

                let mut version = 2u32;
                loop {
                    let candidate = parent.join(format!("{}_{}.{}", stem, version, ext));
                    if !tokio::fs::try_exists(&candidate).await.unwrap_or(false) {
                        break candidate;
                    }
                    version += 1;
                    if version > 9999 {
                        return Err("Too many duplicate files".to_string());
                    }
                }
            }
            _ => {
                return Err(ConversionError::FileConflict {
                    path: final_output_path.to_string_lossy().to_string(),
                }
                .to_string());
            }
        }
    } else {
        final_output_path
    };

    if let Some(parent) = final_output_path.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| e.to_string())?;
    }

    if !request.processing_enabled {
        return copy::copy_file(&app, &state, file_id, input_path, final_output_path).await;
    }

    let config = ConversionConfig {
        input_path: input_path.clone(),
        output_path: final_output_path.clone(),
        output_format: output_format.clone(),
        quality_value: request.quality_value,
        resize_config: request.resize_config.clone(),
        is_muted: request.is_muted,
        strip_metadata: request.strip_metadata,
        conflict_mode: request.conflict_mode.clone(),
        max_bitrate: request.max_bitrate,
        video_preset: request
            .video_preset
            .clone()
            .unwrap_or_else(|| "medium".to_string()),
    };

    if matches!(&output_format, OutputFormat::Image(_)) {
        return convert_image_with_magick(&app, &state, &file_id, &config, &final_output_path)
            .await;
    }

    let args = match &output_format {
        OutputFormat::Video(_) => ffmpeg::build_video_args(&config),
        OutputFormat::Audio(_) => ffmpeg::build_audio_extract_args(&config),
        OutputFormat::Image(_) => unreachable!("Image format is handled above"),
    };

    video::convert_video_or_audio(&app, &state, file_id, args, final_output_path).await
}

#[tauri::command]
pub async fn cancel_conversion(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state.kill_process(&id).await?;
    Ok(())
}

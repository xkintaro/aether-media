use crate::error::ConversionError;
use crate::modules::{ffmpeg, naming, thumbnail};
use crate::state::AppState;
use crate::types::{
    parse_output_format, ConversionConfig, ConversionRequest, ConversionResult, FileInfo,
    FileInfoResult, MediaType, OutputFormat, ProcessStatus, ProgressEvent, ThumbnailRequest,
    ThumbnailResult,
};
use std::collections::VecDeque;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

use std::sync::OnceLock;

static FFMPEG_PATH: OnceLock<PathBuf> = OnceLock::new();

fn get_ffmpeg_path() -> Result<&'static Path, String> {
    if let Some(path) = FFMPEG_PATH.get() {
        return Ok(path.as_path());
    }

    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Failed to get current exe path: {}", e))?
        .parent()
        .ok_or("Failed to get exe parent dir")?
        .to_path_buf();

    let exe_names = vec!["ffmpeg-x86_64-pc-windows-msvc.exe", "ffmpeg.exe"];

    let try_paths = vec![
        exe_dir.clone(),
        exe_dir.join("binaries"),
        exe_dir.join("..").join("..").join("binaries"),
        exe_dir
            .join("..")
            .join("..")
            .join("src-tauri")
            .join("binaries"),
    ];

    let mut checked = Vec::new();

    for base in &try_paths {
        for exe_name in &exe_names {
            let candidate = base.join(exe_name);
            checked.push(candidate.clone());
            if candidate.exists() {
                let resolved = candidate.canonicalize().unwrap_or(candidate);
                let _ = FFMPEG_PATH.set(resolved);
                return Ok(FFMPEG_PATH.get().unwrap().as_path());
            }
        }
    }

    Err(format!(
        "Could not find ffmpeg binary. Checked: {:?}",
        checked
    ))
}

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

    let config = ConversionConfig {
        input_path: input_path.clone(),
        output_path: final_output_path.clone(),
        output_format: output_format.clone(),
        quality_percent: request.quality_percent,
        resize_config: request.resize_config.clone(),
        is_muted: request.is_muted,
        strip_metadata: request.strip_metadata,
        conflict_mode: request.conflict_mode.clone(),
        max_bitrate: request.max_bitrate,
    };

    let args = match &output_format {
        OutputFormat::Video(_) => ffmpeg::build_video_args(&config),
        OutputFormat::Audio(_) => ffmpeg::build_audio_extract_args(&config),
        OutputFormat::Image(_) => ffmpeg::build_image_args(&config),
    };

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

fn calculate_output_path(
    input_path: &Path,
    output_format: &OutputFormat,
    output_directory: Option<&str>,
    naming_config: Option<&crate::types::NamingConfig>,
) -> PathBuf {
    let input_stem = input_path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "output".to_string());

    let output_dir = if let Some(dir) = output_directory {
        PathBuf::from(dir)
    } else {
        input_path.parent().unwrap_or(Path::new(".")).to_path_buf()
    };

    let output_name = if let Some(config) = naming_config {
        naming::apply_naming_pipeline(&input_stem, config)
    } else {
        input_stem
    };

    output_dir.join(format!("{}.{}", output_name, output_format.extension()))
}

#[tauri::command]
pub async fn generate_thumbnail(
    _app: AppHandle,
    request: ThumbnailRequest,
) -> Result<ThumbnailResult, String> {
    generate_single_thumbnail(request).await
}

async fn generate_single_thumbnail(request: ThumbnailRequest) -> Result<ThumbnailResult, String> {
    let (args, output_path) = match request.media_type {
        MediaType::Video => {
            thumbnail::get_video_thumbnail_args(&request.input_path.to_string_lossy(), &request.id)
        }
        MediaType::Image => {
            thumbnail::get_image_thumbnail_args(&request.input_path.to_string_lossy(), &request.id)
        }
        MediaType::Audio => {
            return Ok(ThumbnailResult {
                id: request.id,
                thumbnail_path: None,
                success: true,
                error_message: None,
            });
        }
    };

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
            error_message: Some("FFmpeg failed".to_string()),
        })
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
pub async fn cancel_conversion(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state.kill_process(&id).await?;
    Ok(())
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

#[tauri::command]
pub async fn get_file_info(path: String) -> Result<FileInfo, String> {
    get_single_file_info(&path).await
}

async fn get_single_file_info(path_str: &str) -> Result<FileInfo, String> {
    let path = Path::new(path_str);

    if !path.exists() {
        return Err("File not found".to_string());
    }

    let metadata = tokio::fs::metadata(path).await.map_err(|e| e.to_string())?;
    let size = metadata.len();

    let extension = path
        .extension()
        .map(|s| s.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    let media_type =
        MediaType::from_extension(&extension).ok_or_else(|| "Unsupported format".to_string())?;

    Ok(FileInfo {
        path: path.to_string_lossy().to_string(),
        name: path
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default(),
        size,
        media_type,
    })
}

#[tauri::command]
pub async fn get_files_info_batch(paths: Vec<String>) -> Result<Vec<FileInfoResult>, String> {
    use futures::stream::{self, StreamExt};

    let results: Vec<FileInfoResult> = stream::iter(paths)
        .map(|path| async move {
            match get_single_file_info(&path).await {
                Ok(info) => FileInfoResult {
                    path: path.clone(),
                    info: Some(info),
                    error: None,
                },
                Err(e) => FileInfoResult {
                    path,
                    info: None,
                    error: Some(e),
                },
            }
        })
        .buffer_unordered(10)
        .collect()
        .await;

    Ok(results)
}

#[tauri::command]
pub async fn check_file_exists(path: String) -> bool {
    tokio::fs::try_exists(path).await.unwrap_or(false)
}

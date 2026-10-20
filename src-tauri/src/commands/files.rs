use crate::types::{FileInfo, FileInfoResult, MediaType};
use std::path::Path;

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

use std::path::{Path, PathBuf};
#[cfg(windows)]
pub(super) const CREATE_NO_WINDOW: u32 = 0x08000000;

use std::sync::OnceLock;

static FFMPEG_PATH: OnceLock<PathBuf> = OnceLock::new();
static MAGICK_PATH: OnceLock<PathBuf> = OnceLock::new();

fn get_sidecar_path(
    cache: &'static OnceLock<PathBuf>,
    exe_names: &[&str],
    tool_name: &str,
) -> Result<&'static Path, String> {
    if let Some(path) = cache.get() {
        return Ok(path.as_path());
    }

    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Failed to get current exe path: {}", e))?
        .parent()
        .ok_or("Failed to get exe parent dir")?
        .to_path_buf();

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
        for exe_name in exe_names {
            let candidate = base.join(exe_name);
            checked.push(candidate.clone());
            if candidate.exists() {
                let resolved = candidate.canonicalize().unwrap_or(candidate);
                let _ = cache.set(resolved);
                return Ok(cache.get().unwrap().as_path());
            }
        }
    }

    Err(format!(
        "Could not find {} binary. Checked: {:?}",
        tool_name, checked
    ))
}

pub(super) fn get_ffmpeg_path() -> Result<&'static Path, String> {
    get_sidecar_path(
        &FFMPEG_PATH,
        &["ffmpeg-x86_64-pc-windows-msvc.exe", "ffmpeg.exe"],
        "ffmpeg",
    )
}

pub(super) fn get_magick_path() -> Result<&'static Path, String> {
    get_sidecar_path(
        &MAGICK_PATH,
        &["magick-x86_64-pc-windows-msvc.exe", "magick.exe"],
        "ImageMagick",
    )
}

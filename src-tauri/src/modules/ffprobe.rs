use std::path::{Path, PathBuf};
use std::process::Stdio;
use tokio::process::Command;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

use std::sync::OnceLock;

static FFPROBE_PATH: OnceLock<PathBuf> = OnceLock::new();

#[derive(Debug, Clone)]
pub struct ProbeResult {
    pub video_bitrate: Option<u64>,
    pub audio_bitrate: Option<u64>,
    #[allow(dead_code)]
    pub duration: Option<f64>,
}

fn get_ffprobe_path() -> Result<PathBuf, String> {
    if let Some(path) = FFPROBE_PATH.get() {
        return Ok(path.clone());
    }

    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Failed to get current exe path: {}", e))?
        .parent()
        .ok_or("Failed to get exe parent dir")?
        .to_path_buf();

    let exe_names = vec!["ffprobe-x86_64-pc-windows-msvc.exe", "ffprobe.exe"];

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
                let _ = FFPROBE_PATH.set(resolved.clone());
                return Ok(resolved);
            }
        }
    }

    Err(format!(
        "Could not find ffprobe binary. Checked: {:?}",
        checked
    ))
}

pub async fn probe_media(path: &Path) -> Option<ProbeResult> {
    let ffprobe_path = get_ffprobe_path().ok()?;

    let mut cmd = Command::new(&ffprobe_path);
    cmd.args([
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
    ]);
    cmd.arg(path.as_os_str());
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::null());

    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let output = cmd.output().await.ok()?;

    if !output.status.success() {
        return None;
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    parse_probe_json(&json_str)
}

fn parse_probe_json(json_str: &str) -> Option<ProbeResult> {
    let mut video_bitrate: Option<u64> = None;
    let mut audio_bitrate: Option<u64> = None;
    let mut duration: Option<f64> = None;

    if let Some(format_start) = json_str.find("\"format\"") {
        let format_section = &json_str[format_start..];

        if duration.is_none() {
            duration = extract_json_string_value(format_section, "duration")
                .and_then(|v| v.parse::<f64>().ok());
        }

        let format_bitrate = extract_json_string_value(format_section, "bit_rate")
            .and_then(|v| v.parse::<u64>().ok());

        if video_bitrate.is_none() {
            video_bitrate = format_bitrate;
        }
    }

    let streams_section = extract_streams_array(json_str);
    if let Some(streams) = streams_section {
        for stream in split_json_objects(&streams) {
            let codec_type = extract_json_string_value(&stream, "codec_type");

            match codec_type.as_deref() {
                Some("video") => {
                    if let Some(br) = extract_json_string_value(&stream, "bit_rate")
                        .and_then(|v| v.parse::<u64>().ok())
                    {
                        video_bitrate = Some(br);
                    }
                }
                Some("audio") => {
                    if let Some(br) = extract_json_string_value(&stream, "bit_rate")
                        .and_then(|v| v.parse::<u64>().ok())
                    {
                        audio_bitrate = Some(br);
                    }
                }
                _ => {}
            }
        }
    }

    Some(ProbeResult {
        video_bitrate,
        audio_bitrate,
        duration,
    })
}

fn extract_json_string_value(json: &str, key: &str) -> Option<String> {
    let search_key = format!("\"{}\"", key);
    let key_pos = json.find(&search_key)?;
    let after_key = &json[key_pos + search_key.len()..];

    let after_colon = after_key.find(':').map(|i| &after_key[i + 1..])?;
    let trimmed = after_colon.trim_start();

    if trimmed.starts_with('"') {
        let value_start = 1;
        let value_end = trimmed[value_start..].find('"')?;
        Some(trimmed[value_start..value_start + value_end].to_string())
    } else {
        let end = trimmed.find(|c: char| c == ',' || c == '}' || c == '\n' || c == '\r')?;
        let value = trimmed[..end].trim();
        if value == "null" {
            None
        } else {
            Some(value.to_string())
        }
    }
}

fn extract_streams_array(json: &str) -> Option<String> {
    let start_marker = "\"streams\"";
    let start = json.find(start_marker)?;
    let after = &json[start..];
    let bracket_start = after.find('[')?;
    let content = &after[bracket_start..];

    let mut depth = 0;
    for (i, ch) in content.char_indices() {
        match ch {
            '[' => depth += 1,
            ']' => {
                depth -= 1;
                if depth == 0 {
                    return Some(content[1..i].to_string());
                }
            }
            _ => {}
        }
    }
    None
}

fn split_json_objects(content: &str) -> Vec<String> {
    let mut objects = Vec::new();
    let mut depth = 0;
    let mut start = None;

    for (i, ch) in content.char_indices() {
        match ch {
            '{' => {
                if depth == 0 {
                    start = Some(i);
                }
                depth += 1;
            }
            '}' => {
                depth -= 1;
                if depth == 0 {
                    if let Some(s) = start {
                        objects.push(content[s..=i].to_string());
                    }
                    start = None;
                }
            }
            _ => {}
        }
    }
    objects
}

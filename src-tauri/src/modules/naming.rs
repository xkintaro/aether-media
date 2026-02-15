use crate::types::{NamingBlock, NamingConfig};
use regex::Regex;
use std::sync::{Mutex, OnceLock};

pub fn apply_naming_pipeline(original_stem: &str, config: &NamingConfig) -> String {
    let mut parts: Vec<String> = Vec::new();

    for block in &config.blocks {
        match block {
            NamingBlock::Original => {
                parts.push(original_stem.to_string());
            }
            NamingBlock::Prefix { value } => {
                if !value.is_empty() {
                    parts.push(value.clone());
                }
            }
            NamingBlock::Random { length } => {
                let len = (*length as usize).clamp(4, 32);
                parts.push(generate_random_string(len));
            }
            NamingBlock::Date => {
                parts.push(format_date_timestamp());
            }
        }
    }

    let mut result = parts.join("_");

    if config.sanitize_enabled {
        result = sanitize_filename(&result);
    }

    if result.is_empty() {
        "unnamed".to_string()
    } else {
        result
    }
}

fn format_date_timestamp() -> String {
    static LAST: OnceLock<Mutex<(String, u32)>> = OnceLock::new();
    let state = LAST.get_or_init(|| Mutex::new((String::new(), 0)));

    let ts = chrono::Local::now().format("%Y%m%d%H%M%S%3f").to_string();
    let mut guard = state.lock().unwrap_or_else(|e| e.into_inner());

    if guard.0 == ts {
        guard.1 += 1;
        format!("{}_{}", ts, guard.1)
    } else {
        *guard = (ts.clone(), 1);
        ts
    }
}

fn generate_random_string(length: usize) -> String {
    use rand::Rng;

    let chars: &[u8] = b"abcdefghijklmnopqrstuvwxyz0123456789";
    let mut rng = rand::rng();

    (0..length)
        .map(|_| chars[rng.random_range(0..chars.len())] as char)
        .collect()
}

fn sanitize_filename(name: &str) -> String {
    static RE: OnceLock<Regex> = OnceLock::new();
    let re =
        RE.get_or_init(|| Regex::new(r"[^a-zA-Z0-9_-]").expect("Failed to compile sanitize regex"));

    let lowered = name.to_lowercase().replace(' ', "_");

    let sanitized = re.replace_all(&lowered, "").to_string();

    static RE_MULTI: OnceLock<Regex> = OnceLock::new();
    let re_multi = RE_MULTI
        .get_or_init(|| Regex::new(r"_+").expect("Failed to compile multi-underscore regex"));
    let cleaned = re_multi.replace_all(&sanitized, "_").to_string();

    let trimmed = cleaned.trim_matches('_').to_string();

    if trimmed.is_empty() {
        "file".to_string()
    } else {
        trimmed
    }
}

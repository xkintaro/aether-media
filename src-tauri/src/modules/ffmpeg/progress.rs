pub fn parse_progress(line: &str, duration_secs: Option<f64>) -> Option<u8> {
    if let Some(us_str) = line.strip_prefix("out_time_us=") {
        if let Ok(us) = us_str.trim().parse::<u64>() {
            let current_secs = us as f64 / 1_000_000.0;
            if let Some(total) = duration_secs {
                if total > 0.0 {
                    let progress = ((current_secs / total) * 100.0) as u8;
                    return Some(progress.min(100));
                }
            }
        }
    }

    if let Some(time_val) = line.strip_prefix("out_time=") {
        if let Some(current_secs) = parse_time_to_seconds(time_val) {
            if let Some(total) = duration_secs {
                if total > 0.0 {
                    let progress = ((current_secs / total) * 100.0) as u8;
                    return Some(progress.min(100));
                }
            }
        }
    }

    if let Some(time_idx) = line.find("time=") {
        let time_str = &line[time_idx + 5..];
        let time_val = if let Some(end_idx) = time_str.find(' ') {
            &time_str[..end_idx]
        } else {
            time_str
        };

        if let Some(current_secs) = parse_time_to_seconds(time_val) {
            if let Some(total) = duration_secs {
                if total > 0.0 {
                    let progress = ((current_secs / total) * 100.0) as u8;
                    return Some(progress.min(100));
                }
            }
        }
    }
    None
}

pub fn parse_duration(line: &str) -> Option<f64> {
    if let Some(idx) = line.find("Duration: ") {
        let dur_str = &line[idx + 10..];
        if let Some(comma_idx) = dur_str.find(',') {
            let time_str = &dur_str[..comma_idx];
            return parse_time_to_seconds(time_str);
        }
    }
    None
}

fn parse_time_to_seconds(time: &str) -> Option<f64> {
    let parts: Vec<&str> = time.split(':').collect();
    if parts.len() == 3 {
        let hours: f64 = parts[0].parse().ok()?;
        let mins: f64 = parts[1].parse().ok()?;
        let secs: f64 = parts[2].parse().ok()?;
        Some(hours * 3600.0 + mins * 60.0 + secs)
    } else {
        None
    }
}

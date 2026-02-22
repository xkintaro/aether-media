use crate::types::{
    AudioFormat, BackgroundColor, ConversionConfig, ImageFormat, OutputFormat, ResizeConfig,
    ResizeMode, VideoFormat,
};
use std::ffi::OsString;
use std::path::Path;

struct FFmpegCommandBuilder {
    args: Vec<OsString>,
}

impl FFmpegCommandBuilder {
    fn new() -> Self {
        Self { args: Vec::new() }
    }

    fn input(mut self, path: &Path) -> Self {
        self.args.push("-i".into());
        self.args.push(path.as_os_str().to_owned());
        self
    }

    fn overwrite(mut self, overwrite: bool) -> Self {
        self.args.push(if overwrite { "-y" } else { "-n" }.into());
        self
    }

    fn progress(mut self) -> Self {
        self.args.push("-progress".into());
        self.args.push("pipe:2".into());
        self
    }

    fn strip_metadata(mut self, strip: bool) -> Self {
        if strip {
            self.args.push("-map_metadata".into());
            self.args.push("-1".into());
            self.args.push("-map_chapters".into());
            self.args.push("-1".into());
        }
        self
    }

    fn strip_metadata_audio(mut self, strip: bool) -> Self {
        if strip {
            self.args.push("-map_metadata".into());
            self.args.push("-1".into());
        }
        self
    }

    fn mute(mut self, is_muted: bool) -> Self {
        if is_muted {
            self.args.push("-an".into());
        }
        self
    }

    fn skip_video(mut self) -> Self {
        self.args.push("-vn".into());
        self
    }

    fn ignore_unknown(mut self) -> Self {
        self.args.push("-ignore_unknown".into());
        self
    }

    fn arg(mut self, key: &str, value: &str) -> Self {
        self.args.push(key.into());
        self.args.push(value.into());
        self
    }

    fn filter_complex(mut self, filter: String) -> Self {
        self.args.push("-vf".into());
        self.args.push(filter.into());
        self
    }

    fn output(mut self, path: &Path) -> Self {
        self.args.push(path.as_os_str().to_owned());
        self
    }

    fn build(self) -> Vec<OsString> {
        self.args
    }
}

pub fn build_video_args(config: &ConversionConfig) -> Vec<OsString> {
    let mut builder = FFmpegCommandBuilder::new()
        .input(&config.input_path)
        .progress()
        .overwrite(config.conflict_mode == "overwrite")
        .strip_metadata(config.strip_metadata)
        .mute(config.is_muted)
        .ignore_unknown()
        .arg("-map", "0:v:0");

    if !config.is_muted {
        builder = builder.arg("-map", "0:a:0?");
    }

    if let Some(ref resize) = config.resize_config {
        let filter = build_resize_filter(resize, &config.output_format, true);
        builder = builder.filter_complex(filter);
    }

    let raw_audio_bitrate = 64 + ((config.quality_percent as u32 * 256) / 100);
    let final_audio_bitrate = raw_audio_bitrate.min(320).max(128);
    let audio_bitrate = format!("{}k", final_audio_bitrate);

    let x264_preset = if config.quality_percent >= 80 {
        "slow"
    } else if config.quality_percent >= 50 {
        "medium"
    } else {
        "fast"
    };

    match &config.output_format {
        OutputFormat::Video(VideoFormat::Webm) => {
            builder = builder.arg("-c:v", "libvpx-vp9");
            if !config.is_muted {
                builder = builder.arg("-c:a", "libopus").arg("-b:a", &audio_bitrate);
            }

            let vp9_crf = config.calculate_crf();

            builder = builder.arg("-crf", &vp9_crf.to_string());

            if let Some(user_max) = config.max_bitrate {
                builder = builder
                    .arg("-b:v", &format!("{}k", user_max))
                    .arg("-maxrate", &format!("{}k", user_max))
                    .arg("-bufsize", &format!("{}k", user_max * 5));
            } else {
                builder = builder.arg("-b:v", "0");
            }

            builder = builder
                .arg("-deadline", "good")
                .arg("-cpu-used", "2")
                .arg("-row-mt", "1")
                .arg("-pix_fmt", "yuv420p");
        }
        OutputFormat::Video(VideoFormat::Mp4) => {
            builder = builder.arg("-c:v", "libx264");
            if !config.is_muted {
                builder = builder.arg("-c:a", "aac").arg("-b:a", &audio_bitrate);
            }
            builder = builder.arg("-crf", &config.calculate_crf().to_string());

            builder = builder
                .arg("-preset", x264_preset)
                .arg("-movflags", "+faststart")
                .arg("-pix_fmt", "yuv420p");
        }
        OutputFormat::Video(VideoFormat::Mkv) => {
            builder = builder.arg("-c:v", "libx264");
            if !config.is_muted {
                builder = builder.arg("-c:a", "aac").arg("-b:a", &audio_bitrate);
            }
            builder = builder.arg("-crf", &config.calculate_crf().to_string());

            builder = builder
                .arg("-preset", x264_preset)
                .arg("-pix_fmt", "yuv420p");
        }
        OutputFormat::Video(VideoFormat::Mov) => {
            builder = builder.arg("-c:v", "libx264");
            if !config.is_muted {
                builder = builder.arg("-c:a", "aac").arg("-b:a", &audio_bitrate);
            }
            builder = builder
                .arg("-crf", &config.calculate_crf().to_string())
                .arg("-preset", x264_preset)
                .arg("-movflags", "+faststart")
                .arg("-pix_fmt", "yuv420p");
        }
        _ => {}
    }

    if let Some(user_max) = config.max_bitrate {
        let is_crf_codec = matches!(
            &config.output_format,
            OutputFormat::Video(VideoFormat::Mp4)
                | OutputFormat::Video(VideoFormat::Mkv)
                | OutputFormat::Video(VideoFormat::Mov)
        );
        if is_crf_codec {
            builder = builder
                .arg("-maxrate", &format!("{}k", user_max))
                .arg("-bufsize", &format!("{}k", user_max * 5));
        }
    }

    builder.output(&config.output_path).build()
}

pub fn build_audio_extract_args(config: &ConversionConfig) -> Vec<OsString> {
    let mut builder = FFmpegCommandBuilder::new()
        .input(&config.input_path)
        .progress()
        .overwrite(config.conflict_mode == "overwrite")
        .strip_metadata_audio(config.strip_metadata)
        .skip_video();

    if let OutputFormat::Audio(audio_format) = &config.output_format {
        builder = builder.arg(
            "-c:a",
            match audio_format {
                AudioFormat::Mp3 => "libmp3lame",
                AudioFormat::Aac => "aac",
                AudioFormat::M4a => "aac",
                AudioFormat::Ogg => "libvorbis",
            },
        );

        match audio_format {
            AudioFormat::Mp3 => {
                let q_raw = (100.0 - config.quality_percent as f32) / 100.0 * 9.0;
                let q = q_raw.round() as u8;
                builder = builder.arg("-q:a", &q.min(9).to_string());
            }
            AudioFormat::Aac | AudioFormat::M4a => {
                let calculated_bitrate = 64 + ((config.quality_percent as u32 * 256) / 100);
                let final_bitrate = calculated_bitrate.min(320).max(128);

                builder = builder.arg("-b:a", &format!("{}k", final_bitrate));
            }
            AudioFormat::Ogg => {
                let q = (config.quality_percent as f32 / 100.0 * 8.0).round() as u8;
                builder = builder.arg("-q:a", &q.max(1).min(8).to_string());
            }
        }
    }

    builder.output(&config.output_path).build()
}

pub fn build_image_args(config: &ConversionConfig) -> Vec<OsString> {
    let mut builder = FFmpegCommandBuilder::new()
        .input(&config.input_path)
        .overwrite(config.conflict_mode == "overwrite");

    let mut filters: Vec<String> = Vec::new();
    if let Some(ref resize) = config.resize_config {
        filters.push(build_resize_filter(resize, &config.output_format, false));
    }
    if !filters.is_empty() {
        builder = builder.filter_complex(filters.join(","));
    }

    match &config.output_format {
        OutputFormat::Image(ImageFormat::Jpg) => {
            let qscale = 31 - ((config.quality_percent as f32 / 100.0) * 29.0) as u8;
            builder = builder.arg("-q:v", &qscale.max(2).to_string());
        }
        OutputFormat::Image(ImageFormat::Webp) => {
            let webp_quality = 20 + ((config.quality_percent as u32 * 72) / 100);
            builder = builder.arg("-quality", &webp_quality.min(92).to_string());
            builder = builder
                .arg("-preset", "photo")
                .arg("-compression_level", "6");
        }
        OutputFormat::Image(ImageFormat::Png) => {
            builder = builder.arg("-compression_level", "9");
        }
        _ => {}
    }
    builder.output(&config.output_path).build()
}

fn build_resize_filter(
    resize: &ResizeConfig,
    output_format: &OutputFormat,
    is_video: bool,
) -> String {
    let w = (resize.width / 2) * 2;
    let h = (resize.height / 2) * 2;
    let supports_alpha = output_format.supports_transparency();

    match resize.mode {
        ResizeMode::Fill => {
            format!("scale={}:{}", w, h)
        }
        ResizeMode::Cover => {
            format!(
                "scale={}:{}:force_original_aspect_ratio=increase,crop={}:{}",
                w, h, w, h
            )
        }
        ResizeMode::Contain => {
            if supports_alpha && matches!(resize.background_color, BackgroundColor::Transparent) {
                let pixel_format = if is_video { "yuva420p" } else { "rgba" };
                format!(
                    "format={},scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2:color=0x00000000",
                    pixel_format, w, h, w, h
                )
            } else {
                let bg_color = match &resize.background_color {
                    BackgroundColor::Black => "black".to_string(),
                    BackgroundColor::White => "white".to_string(),
                    BackgroundColor::Transparent => "black".to_string(),
                };
                format!(
                    "scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2:color={}",
                    w, h, w, h, bg_color
                )
            }
        }
    }
}

pub fn build_thumbnail_args(input_path: &Path, output_path: &Path) -> Vec<OsString> {
    FFmpegCommandBuilder::new()
        .arg("-ss", "00:00:01")
        .input(input_path)
        .arg("-vframes", "1")
        .filter_complex("scale=120:-1".to_string())
        .overwrite(true)
        .output(output_path)
        .build()
}

pub fn build_image_thumbnail_args(input_path: &Path, output_path: &Path) -> Vec<OsString> {
    FFmpegCommandBuilder::new()
        .input(input_path)
        .arg("-vframes", "1")
        .filter_complex("scale=120:-1".to_string())
        .overwrite(true)
        .output(output_path)
        .build()
}

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

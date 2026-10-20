use super::builder::FFmpegCommandBuilder;
use super::resize::build_resize_filter;
use crate::types::{AudioFormat, ConversionConfig, OutputFormat, VideoFormat};
use std::ffi::OsString;

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

    let audio_bitrate = "192k";
    match &config.output_format {
        OutputFormat::Video(VideoFormat::Webm) => {
            builder = builder.arg("-c:v", "libvpx-vp9");
            if !config.is_muted {
                builder = builder.arg("-c:a", "libopus").arg("-b:a", &audio_bitrate);
            }

            let vp9_crf = config.quality_value;

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
        OutputFormat::Video(ref v @ (VideoFormat::Mp4 | VideoFormat::Mkv | VideoFormat::Mov)) => {
            builder = builder.arg("-c:v", "libx264");
            if !config.is_muted {
                builder = builder.arg("-c:a", "aac").arg("-b:a", &audio_bitrate);
            }
            builder = builder
                .arg("-crf", &config.quality_value.to_string())
                .arg("-preset", &config.video_preset)
                .arg("-pix_fmt", "yuv420p");
            if matches!(v, VideoFormat::Mp4 | VideoFormat::Mov) {
                builder = builder.arg("-movflags", "+faststart");
            }
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
                builder = builder.arg("-q:a", &config.quality_value.min(9).to_string());
            }
            AudioFormat::Aac | AudioFormat::M4a => {
                let final_bitrate = config.quality_value.min(320).max(128);
                builder = builder.arg("-b:a", &format!("{}k", final_bitrate));
            }
            AudioFormat::Ogg => {
                let q = config.quality_value.max(1).min(8);
                builder = builder.arg("-q:a", &q.to_string());
            }
        }
    }

    builder.output(&config.output_path).build()
}

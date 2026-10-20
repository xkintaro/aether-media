use super::*;
use crate::types::{
    parse_output_format, BackgroundColor, ConversionConfig, ResizeConfig, ResizeMode,
};

fn config(format: &str) -> ConversionConfig {
    ConversionConfig {
        input_path: "C:/media/örnek clip.mp4".into(),
        output_path: format!("C:/output/result.{format}").into(),
        output_format: parse_output_format(format).unwrap(),
        quality_value: 23,
        resize_config: None,
        is_muted: false,
        strip_metadata: false,
        conflict_mode: "skip".into(),
        max_bitrate: None,
        video_preset: "medium".into(),
    }
}

fn strings(args: Vec<OsString>) -> Vec<String> {
    args.into_iter()
        .map(|arg| arg.into_string().unwrap())
        .collect()
}

#[test]
fn mp4_arguments_preserve_stream_selection_and_order() {
    assert_eq!(
        strings(build_video_args(&config("mp4"))),
        vec![
            "-i",
            "C:/media/örnek clip.mp4",
            "-progress",
            "pipe:2",
            "-n",
            "-ignore_unknown",
            "-map",
            "0:v:0",
            "-map",
            "0:a:0?",
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-crf",
            "23",
            "-preset",
            "medium",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "C:/output/result.mp4",
        ]
    );
}

#[test]
fn codecs_mute_metadata_and_bitrate_options_are_preserved() {
    for (format, codec) in [
        ("mp4", "libx264"),
        ("mkv", "libx264"),
        ("mov", "libx264"),
        ("webm", "libvpx-vp9"),
    ] {
        let mut cfg = config(format);
        cfg.is_muted = true;
        cfg.strip_metadata = true;
        cfg.conflict_mode = "overwrite".into();
        cfg.max_bitrate = Some(2500);
        let args = strings(build_video_args(&cfg));
        for pair in [
            ["-c:v", codec],
            ["-map_metadata", "-1"],
            ["-map_chapters", "-1"],
            ["-maxrate", "2500k"],
            ["-bufsize", "12500k"],
        ] {
            assert!(
                args.windows(2).any(|window| window == pair),
                "{format}: {pair:?}"
            );
        }
        assert!(args.contains(&"-y".to_string()));
        assert!(args.contains(&"-an".to_string()));
        assert!(!args.contains(&"-c:a".to_string()));
        assert_eq!(
            args.contains(&"+faststart".to_string()),
            format == "mp4" || format == "mov"
        );
    }
    let args = strings(build_video_args(&config("webm")));
    assert!(args.windows(2).any(|window| window == ["-b:v", "0"]));
    assert!(args.windows(2).any(|window| window == ["-c:a", "libopus"]));
}

#[test]
fn audio_quality_bounds_and_codecs_are_preserved() {
    for (format, codec, flag, low, high) in [
        ("mp3", "libmp3lame", "-q:a", "0", "9"),
        ("aac", "aac", "-b:a", "128k", "320k"),
        ("m4a", "aac", "-b:a", "128k", "320k"),
        ("ogg", "libvorbis", "-q:a", "1", "8"),
    ] {
        for (quality, expected) in [(0, low), (999, high)] {
            let mut cfg = config(format);
            cfg.quality_value = quality;
            let args = strings(build_audio_extract_args(&cfg));
            assert!(args.windows(2).any(|window| window == ["-c:a", codec]));
            assert!(args.windows(2).any(|window| window == [flag, expected]));
            assert!(args.contains(&"-vn".to_string()));
        }
    }
}

#[test]
fn resize_filters_preserve_even_dimensions_and_alpha_fallback() {
    use super::resize::build_resize_filter;
    let mut resize = ResizeConfig {
        width: 641,
        height: 481,
        mode: ResizeMode::Fill,
        background_color: BackgroundColor::Transparent,
    };
    let mp4 = config("mp4").output_format;
    let webm = config("webm").output_format;
    assert_eq!(build_resize_filter(&resize, &mp4, true), "scale=640:480");
    resize.mode = ResizeMode::Cover;
    assert_eq!(
        build_resize_filter(&resize, &mp4, true),
        "scale=640:480:force_original_aspect_ratio=increase,crop=640:480"
    );
    resize.mode = ResizeMode::Contain;
    assert_eq!(build_resize_filter(&resize, &mp4, true), "scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2:color=black");
    assert_eq!(build_resize_filter(&resize, &webm, true), "format=yuva420p,scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2:color=0x00000000");
}

#[test]
fn progress_parser_handles_all_supported_log_styles() {
    for line in [
        "out_time_us=2500000",
        "out_time=00:00:02.500",
        "frame=20 time=00:00:02.500 bitrate=100k",
    ] {
        assert_eq!(parse_progress(line, Some(10.0)), Some(25));
        assert_eq!(parse_progress(line, None), None);
        assert_eq!(parse_progress(line, Some(0.0)), None);
    }
    assert_eq!(
        parse_progress("out_time_us=11000000", Some(10.0)),
        Some(100)
    );
    assert_eq!(parse_progress("out_time_us=N/A", Some(10.0)), None);
    assert_eq!(
        parse_duration("  Duration: 01:02:03.50, start: 0"),
        Some(3723.5)
    );
    assert_eq!(parse_duration("Duration: N/A, start: 0"), None);
}

#[test]
fn thumbnail_arguments_preserve_seek_and_size() {
    assert_eq!(
        strings(build_thumbnail_args(
            Path::new("input.mp4"),
            Path::new("thumb.jpg")
        )),
        vec![
            "-ss",
            "00:00:01",
            "-i",
            "input.mp4",
            "-vframes",
            "1",
            "-q:v",
            "5",
            "-vf",
            "scale=240:-1",
            "-y",
            "thumb.jpg",
        ]
    );
}

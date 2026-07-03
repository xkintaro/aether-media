use crate::types::{
    BackgroundColor, ConversionConfig, ImageFormat, OutputFormat, ResizeConfig, ResizeMode,
};
use std::ffi::OsString;
use std::path::Path;

struct MagickCommandBuilder {
    args: Vec<OsString>,
}

impl MagickCommandBuilder {
    fn new() -> Self {
        Self { args: Vec::new() }
    }

    fn input(mut self, path: &Path) -> Self {
        self.args.push(path.as_os_str().to_owned());
        self
    }

    fn arg(mut self, value: &str) -> Self {
        self.args.push(value.into());
        self
    }

    fn arg_pair(mut self, key: &str, value: &str) -> Self {
        self.args.push(key.into());
        self.args.push(value.into());
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

pub fn build_image_convert_args(config: &ConversionConfig) -> Vec<OsString> {
    let mut builder = MagickCommandBuilder::new().input(&config.input_path);

    if config.strip_metadata {
        builder = builder.arg("-strip");
    }

    if let Some(ref resize) = config.resize_config {
        builder = apply_resize(builder, resize, &config.output_format);
    }

    match &config.output_format {
        OutputFormat::Image(ImageFormat::Jpg) => {
            let im_quality = ffmpeg_qv_to_magick_quality(config.quality_value);
            builder = builder.arg_pair("-quality", &im_quality.to_string());
        }
        OutputFormat::Image(ImageFormat::Webp) => {
            builder = builder.arg_pair("-quality", &config.quality_value.to_string());
        }
        OutputFormat::Image(ImageFormat::Png) => {
            builder = builder.arg_pair("-quality", "95");
        }
        _ => {}
    }

    builder.output(&config.output_path).build()
}

pub fn build_image_thumbnail_args(input_path: &Path, output_path: &Path) -> Vec<OsString> {
    MagickCommandBuilder::new()
        .input(input_path)
        .arg_pair("-thumbnail", "240x")
        .arg_pair("-quality", "75")
        .output(output_path)
        .build()
}

fn ffmpeg_qv_to_magick_quality(qv: u16) -> u16 {
    let qv = qv.clamp(2, 31);
    let quality = ((31.0 - qv as f64) / (31.0 - 2.0) * 96.0 + 1.0) as u16;
    quality.clamp(1, 100)
}

fn apply_resize(
    builder: MagickCommandBuilder,
    resize: &ResizeConfig,
    output_format: &OutputFormat,
) -> MagickCommandBuilder {
    let w = resize.width;
    let h = resize.height;
    let supports_alpha = output_format.supports_transparency();

    match resize.mode {
        ResizeMode::Fill => {
            builder.arg_pair("-resize", &format!("{}x{}!", w, h))
        }
        ResizeMode::Cover => {
            builder
                .arg_pair("-resize", &format!("{}x{}^", w, h))
                .arg_pair("-gravity", "Center")
                .arg_pair("-extent", &format!("{}x{}", w, h))
        }
        ResizeMode::Contain => {
            let bg_color =
                if supports_alpha && matches!(resize.background_color, BackgroundColor::Transparent)
                {
                    "none"
                } else {
                    match &resize.background_color {
                        BackgroundColor::Black | BackgroundColor::Transparent => "black",
                        BackgroundColor::White => "white",
                    }
                };

            builder
                .arg_pair("-resize", &format!("{}x{}", w, h))
                .arg_pair("-background", bg_color)
                .arg_pair("-gravity", "Center")
                .arg_pair("-extent", &format!("{}x{}", w, h))
        }
    }
}

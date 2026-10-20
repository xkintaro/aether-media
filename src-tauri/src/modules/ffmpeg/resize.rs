use crate::types::{BackgroundColor, OutputFormat, ResizeConfig, ResizeMode};

pub(super) fn build_resize_filter(
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

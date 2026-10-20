use crate::modules::naming;
use crate::types::OutputFormat;
use std::path::{Path, PathBuf};

pub(super) fn calculate_output_path(
    input_path: &Path,
    output_format: &OutputFormat,
    output_directory: Option<&str>,
    naming_config: Option<&crate::types::NamingConfig>,
) -> PathBuf {
    let input_stem = input_path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "output".to_string());

    let output_dir = if let Some(dir) = output_directory {
        PathBuf::from(dir)
    } else {
        input_path.parent().unwrap_or(Path::new(".")).to_path_buf()
    };

    let output_name = if let Some(config) = naming_config {
        naming::apply_naming_pipeline(&input_stem, config)
    } else {
        input_stem
    };

    output_dir.join(format!("{}.{}", output_name, output_format.extension()))
}

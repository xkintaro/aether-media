import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sourceAt } from "./helpers/source-runtime.mjs";

// Token comparison keeps string literals intact, including event names, errors,
// codec flags and paths. Ignore formatting-only trailing commas.
function tokens(source) {
  return source.match(/"(?:\\.|[^"\\])*"|\/\/[^\n]*|[A-Za-z_][\w]*|\d+(?:\.\d+)?|[^\s]/g)
    .filter((token) => token !== "," && !token.startsWith("//"));
}
function body(source, name) {
  const parts = tokens(source);
  const start = parts.findIndex((token, i) => token === "fn" && parts[i + 1] === name);
  assert.notEqual(start, -1, name);
  let opening = parts.indexOf("{", start), depth = 1, end = opening + 1;
  for (; depth && end < parts.length; end++) {
    if (parts[end] === "{") depth++;
    if (parts[end] === "}") depth--;
  }
  return parts.slice(opening + 1, end - 1);
}
const read = (file) => fs.readFileSync(file, "utf8");

test("moved Rust command functions retain their exact executable tokens", () => {
  const original = sourceAt("src-tauri/src/commands.rs", true);
  const groups = {
    "sidecars.rs": ["get_sidecar_path", "get_ffmpeg_path", "get_magick_path"],
    "files.rs": ["get_file_info", "get_single_file_info", "get_files_info_batch", "check_file_exists"],
    "thumbnails.rs": ["generate_thumbnail", "generate_single_thumbnail", "generate_thumbnails_batch", "delete_thumbnails", "cleanup_all_temp_thumbnails"],
    "conversion/image.rs": ["convert_image_with_magick"],
    "conversion/output_path.rs": ["calculate_output_path"],
    "conversion/mod.rs": ["cancel_conversion"],
  };
  for (const [file, names] of Object.entries(groups)) for (const name of names) {
    assert.deepEqual(body(read(`src-tauri/src/commands/${file}`), name), body(original, name), name);
  }
  const originalVideo = original.slice(original.indexOf("    let sidecar_path = get_ffmpeg_path()?;"), original.indexOf("async fn convert_image_with_magick"));
  assert.deepEqual(body(read("src-tauri/src/commands/conversion/video.rs"), "convert_video_or_audio"), tokens(originalVideo).slice(0, -1));
  const copyStart = original.indexOf("    if !request.processing_enabled {\n        state");
  const copyEnd = original.indexOf("    let config = ConversionConfig", copyStart);
  const originalCopy = original.slice(copyStart, copyEnd);
  assert.deepEqual(body(read("src-tauri/src/commands/conversion/copy.rs"), "copy_file"), tokens(originalCopy).slice(6, -1));

  let coordinator = read("src-tauri/src/commands/conversion/mod.rs");
  const copyBody = body(read("src-tauri/src/commands/conversion/copy.rs"), "copy_file").join(" ");
  const videoBody = body(read("src-tauri/src/commands/conversion/video.rs"), "convert_video_or_audio").join(" ");
  coordinator = coordinator.replace(/return copy::copy_file\([\s\S]*?\)\s*\.await;/, copyBody);
  coordinator = coordinator.replace(/video::convert_video_or_audio\([\s\S]*?\)\s*\.await/, videoBody);
  assert.deepEqual(body(coordinator, "convert_file"), body(original, "convert_file"), "conversion orchestration after expanding extracted helpers");
});

test("FFmpeg builders, filters and parsers retain their original function bodies", () => {
  const original = sourceAt("src-tauri/src/modules/ffmpeg.rs", true);
  for (const [file, names] of Object.entries({
    "encoding.rs": ["build_video_args", "build_audio_extract_args"],
    "progress.rs": ["parse_progress", "parse_duration", "parse_time_to_seconds"],
    "resize.rs": ["build_resize_filter"],
    "builder.rs": ["new", "input", "overwrite", "progress", "strip_metadata", "strip_metadata_audio", "mute", "skip_video", "ignore_unknown", "arg", "filter_complex", "output", "build"],
  })) for (const name of names) {
    assert.deepEqual(body(read(`src-tauri/src/modules/ffmpeg/${file}`), name), body(original, name), name);
  }
  assert.deepEqual(body(read("src-tauri/src/modules/ffmpeg.rs"), "build_thumbnail_args"), body(original, "build_thumbnail_args"));
});

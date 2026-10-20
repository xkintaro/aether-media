import test from "node:test";
import assert from "node:assert/strict";
import { createRuntime, sourceAt, serializable } from "./helpers/source-runtime.mjs";

test("conversion requests preserve all format, quality, naming and conflict branches", () => {
  const old = createRuntime({ baseline: true });
  const current = createRuntime();
  const original = sourceAt("src/hooks/useConversionQueue.ts", true);
  const start = original.indexOf("        let outputFormat:");
  const end = original.indexOf("        const result = await invoke", start);
  assert.ok(start > 0 && end > start);
  const source = `import { getDefaultOutputFormat, DEFAULT_RANDOM_LENGTH, getQualityConfigForFormat } from "@/types";
    export function build(item, mergedSettings, conflictMode) {
      const itemId = item.id;
      const useAppSettingsStore = { getState: () => ({ conflictMode }) };
      ${original.slice(start, end)}
      return request;
    }`;
  const before = old.load("tests/original-request.ts", source).build;
  const after = current.load("src/lib/conversion/buildRequest.ts").buildConversionRequest;
  const defaults = current.load("src/types/index.ts").DEFAULT_SETTINGS;
  let cases = 0;
  for (const [mediaType, extensions, formats] of [
    ["video", ["mp4", "avi", "webm", ""], [null, "mp4", "mkv", "mov", "webm", "mp3"]],
    ["image", ["jpeg", "png", "tiff", ""], [null, "jpg", "png", "webp"]],
    ["audio", ["mp3", "wav", "opus", ""], [null, "mp3", "aac", "m4a", "ogg"]],
  ]) for (const extension of extensions) for (const format of formats)
    for (const quality of [-1, 0, 5, 23, 80, 192, 999])
      for (const conflictMode of ["skip", "overwrite", "keep_both", ""])
        for (const processingEnabled of [true, false]) {
          const item = { id: "sample", inputPath: `C:/media/file.${extension}`, mediaType };
          const settings = {
            ...structuredClone(defaults), [`${mediaType}Format`]: format,
            videoQuality: quality, imageQuality: quality, audioQuality: quality,
            dynamicVideoQuality: { webm: 41 }, dynamicImageQuality: { jpg: 7 },
            dynamicAudioQuality: { mp3: 3 }, processingEnabled,
            resizeEnabled: quality > 0, isMuted: quality % 2 === 0,
            stripMetadata: quality % 2 !== 0, outputDirectory: quality > 5 ? "C:/out" : "",
            maxBitrate: quality > 100 ? 9000 : null, videoPreset: "slow",
            namingConfig: { sanitizeEnabled: true, blocks: [
              { type: "prefix", params: { value: "" } }, { type: "original" },
              { type: "random", params: { length: 0 } }, { type: "date" }, { type: "unknown" },
            ] },
          };
          assert.deepEqual(serializable(after(item, settings, conflictMode)), serializable(before(item, settings, conflictMode)));
          cases++;
        }
  assert.equal(cases, 3360);
});

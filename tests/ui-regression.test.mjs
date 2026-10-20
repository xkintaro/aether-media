import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRuntime } from "./helpers/source-runtime.mjs";

const noop = () => {};
// React useId incorporates component ancestry. Extracting components can change
// opaque generated IDs, while their associated labels and controls stay intact.
const html = (component, props) => renderToStaticMarkup(React.createElement(component, props))
  .replace(/radix-[^\s"<>]+/g, "radix-generated-id");

test("settings UI renders identically for mixed media, overrides and rename-only mode", () => {
  const runtimes = [true, false].map((baseline) => createRuntime({ baseline, renderStores: true }));
  const components = runtimes.map((r) => r.load("src/components/settings/SettingsPanel.tsx").SettingsPanel);
  const defaults = runtimes[1].load("src/types/index.ts").DEFAULT_SETTINGS;
  let cases = 0;
  for (const mode of ["global", "local"])
    for (const mask of [0, 1, 2, 3, 4, 5, 6, 7])
      for (const processingEnabled of [true, false])
        for (const original of [true, false]) {
          const props = {
            mode, hasVideo: Boolean(mask & 1), hasImage: Boolean(mask & 2), hasAudio: Boolean(mask & 4),
            settings: { ...defaults, processingEnabled, resizeEnabled: true,
              videoFormat: original ? null : "webm", imageFormat: original ? null : "webp", audioFormat: original ? null : "aac",
              dynamicVideoQuality: { mp4: 31 }, dynamicImageQuality: { jpg: 8 }, dynamicAudioQuality: { mp3: 4 },
              namingConfig: { sanitizeEnabled: true, blocks: [
                { id: "a", type: "prefix", params: { value: "archive" } },
                { id: "b", type: "original" }, { id: "c", type: "random", params: { length: 12 } },
              ] },
            },
            originalVideoFormats: ["mp4", "webm"], originalImageFormats: ["jpg", "png"], originalAudioFormats: ["mp3", "aac"],
            showOutputDir: true, outputDirectory: "C:/output", onSelectOutputDir: noop, onSettingsChange: noop,
          };
          assert.equal(html(components[1], props), html(components[0], props), JSON.stringify({ mode, mask, processingEnabled, original }));
          cases++;
        }
  assert.equal(cases, 64);
});

test("file rows preserve markup across statuses, selection and expanded settings", () => {
  const runtimes = [true, false].map((baseline) => createRuntime({ baseline, renderStores: true }));
  const components = runtimes.map((r) => r.load("src/components/file-table/FileRow.tsx").FileRow);
  const stores = runtimes.map((r) => r.load("src/store/queueStore.ts").useQueueStore);
  for (const status of ["pending", "processing", "completed", "error", "cancelled", "conflict"])
    for (const mediaType of ["video", "image", "audio"])
      for (const expanded of [true, false]) for (const isSelected of [true, false]) {
        const item = { id: "sample", inputPath: "C:/input.mp4", fileName: "input.mp4", fileSize: 1024,
          mediaType, status, progress: 45, thumbnailStatus: "error", errorMessage: status === "error" ? "Failed" : undefined,
          overrideSettings: { isMuted: true } };
        for (const store of stores) store.setState({ expandedId: expanded ? item.id : null, isProcessing: status === "processing" });
        const props = { item, isSelected, onRemove: noop, onCancel: noop, onPreview: noop };
        assert.equal(html(components[1], props), html(components[0], props), `${status}/${mediaType}/${expanded}/${isSelected}`);
      }
});

test("application shell, table and sidebar preserve empty and populated states", () => {
  const runtimes = [true, false].map((baseline) => createRuntime({ baseline, renderStores: true }));
  for (const file of ["src/App.tsx", "src/components/file-table/FileTable.tsx", "src/components/layout/Sidebar.tsx"]) {
    const components = runtimes.map((r) => Object.values(r.load(file))[0]);
    for (const populated of [false, true]) {
      for (const runtime of runtimes) {
        const store = runtime.load("src/store/queueStore.ts").useQueueStore;
        store.getState().clearQueue();
        if (populated) store.getState().addFiles([
          { path: "C:/clip.mp4", name: "clip.mp4", size: 2048, mediaType: "video" },
          { path: "C:/photo.jpg", name: "photo.jpg", size: 1024, mediaType: "image" },
        ]);
      }
      assert.equal(html(components[1], {}), html(components[0], {}), `${file}/${populated}`);
    }
  }
});

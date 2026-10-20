import test from "node:test";
import assert from "node:assert/strict";
import { createRuntime, serializable } from "./helpers/source-runtime.mjs";

const files = ["video", "image", "audio"].map((mediaType, index) => ({
  path: `C:/media/input-${index}.dat`, name: `input-${index}`, size: 100 + index, mediaType,
}));

async function exercise(baseline) {
  const runtime = createRuntime({ baseline, invoke: async (_command, args) =>
    args?.paths?.map((path) => ({ path, error: "missing" })) });
  const store = runtime.load("src/store/queueStore.ts").useQueueStore;
  const snapshots = [];
  const checkpoint = () => snapshots.push(serializable(store.getState()));
  const action = async (name, ...args) => {
    const result = await store.getState()[name](...args);
    snapshots.push({ name, result: serializable(result ?? null) });
    checkpoint();
  };
  await action("addFiles", files);
  await action("addFiles", files);
  const [a, b, c] = store.getState().items.map((item) => item.id);
  for (const [name, ...args] of [
    ["selectItem", a], ["selectItem", b, true], ["toggleSelection", a],
    ["selectRange", a, c], ["selectRange", "missing", c], ["getSelectedItems"],
    ["selectAll"], ["deselectAll"], ["setExpandedId", b],
    ["updateProgress", a, 31], ["updateProgress", "missing", 50],
    ["updateStatus", a, "completed"], ["setOutputPath", a, "C:/output.mp4"],
    ["updateStatus", b, "error", "example failure"], ["updateStatus", c, "cancelled"],
    ["resumeQueue", false], ["resumeQueue", true], ["retryCompleted"],
    ["updateStatus", a, "error"], ["resetQueueStatus"], ["getNextPendingItem"],
    ["setThumbnailLoading", a], ["setThumbnail", a, "C:/thumb.jpg"],
    ["setThumbnailLoading", a], ["setThumbnailError", b], ["validateThumbnails"],
    ["updateOverrides", a, { videoQuality: 29 }],
    ["updateItemOverride", a, { isMuted: true }], ["clearOverrides", a],
    ["updateItemOverride", b, { imageQuality: 9 }], ["updateItemOverride", b, null],
    ["updateOverrides", c, { stripMetadata: true }], ["clearAllOverrides"],
    ["setIsProcessing", true], ["removeItems", [b]], ["clearQueue"],
    ["setIsProcessing", false], ["removeItems", [b]],
    ["confirmSessionRestore"], ["clearQueue"], ["addFiles", files], ["discardSession"],
  ]) await action(name, ...args);
  return { snapshots, persisted: [...runtime.storage], calls: runtime.calls };
}

test("all 28 queue actions preserve state transitions, return values and persistence", async () => {
  assert.deepEqual(await exercise(false), await exercise(true));
});

test("saved queues hydrate with identical indexes, selection and restore flags", () => {
  const persisted = { "aether-media-queue": JSON.stringify({ state: { items: [
    { id: "saved", inputPath: "C:/clip.mp4", mediaType: "video", status: "processing", progress: 34 },
  ] }, version: 0 }) };
  const states = [true, false].map((baseline) => {
    const runtime = createRuntime({ baseline, persisted });
    return serializable(runtime.load("src/store/queueStore.ts").useQueueStore.getState());
  });
  assert.deepEqual(states[1], states[0]);
  assert.equal(states[1].hasPersistedQueue, true);
  assert.deepEqual(states[1].itemIndex, [["saved", 0]]);
});

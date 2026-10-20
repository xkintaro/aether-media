import test from "node:test";
import assert from "node:assert/strict";
import { createRuntime } from "./helpers/source-runtime.mjs";

const inputPath = "C:/media/source.mp4";
const outputPath = "C:/output/converted.mp4";

function setup(exists = () => true) {
  const runtime = createRuntime({
    renderStores: true,
    invoke: async (_command, { path }) => exists(path),
  });
  const store = runtime.load("src/store/queueStore.ts").useQueueStore;
  store.getState().addFiles([
    { path: inputPath, name: "source.mp4", size: 100, mediaType: "video" },
  ]);
  const id = store.getState().items[0].id;
  const { useFileRow } = runtime.load("src/components/file-table/row/useFileRow.ts");
  const reveal = () => useFileRow({
    item: store.getState().items[0],
    onRemove() {},
    onPreview() {},
  }).handleRevealInExplorer();
  return { runtime, store, id, reveal };
}

test("Open Location uses the source after a completed file is queued again", async () => {
  const { runtime, store, id, reveal } = setup((path) => path === inputPath);
  store.getState().setOutputPath(id, outputPath);
  store.getState().updateStatus(id, "completed");
  store.getState().retryCompleted();
  assert.equal(store.getState().items[0].status, "pending");
  await reveal();
  assert.deepEqual(runtime.calls, [
    { command: "check_file_exists", args: { path: inputPath } },
    { command: "revealItemInDir", args: { path: inputPath } },
  ]);
});

test("Open Location selects output only for completed files", async () => {
  for (const status of ["pending", "processing", "completed", "error", "cancelled"]) {
    const { runtime, store, id, reveal } = setup();
    store.getState().setOutputPath(id, outputPath);
    store.getState().updateStatus(id, status);
    await reveal();
    const path = status === "completed" ? outputPath : inputPath;
    assert.deepEqual(runtime.calls, [
      { command: "check_file_exists", args: { path } },
      { command: "revealItemInDir", args: { path } },
    ], status);
  }
});

test("Open Location falls back to source without an output and rejects missing files", async () => {
  for (const exists of [true, false]) {
    const { runtime, store, id, reveal } = setup(() => exists);
    store.getState().updateStatus(id, "completed");
    await reveal();
    assert.equal(runtime.calls[0].args.path, inputPath);
    assert.equal(runtime.calls.some((call) => call.command === "revealItemInDir"), exists);
    const toasts = runtime.load("src/store/toastStore.ts").useToastStore.getState().toasts;
    assert.equal(toasts.some((toast) => toast.message === "File not found"), !exists);
  }
});

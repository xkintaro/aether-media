# Source layout

Aether Media keeps its existing React/Zustand frontend and Rust/Tauri backend.
Modules are grouped by responsibility. The public imports from `@/types`,
`@/store/queueStore`, `commands`, and `modules::ffmpeg` remain available.

## Frontend

- `App.tsx` composes the application shell. `useSessionRestore`, `useFileImport`,
  and `useFileDrop` own session prompts, batched file ingestion, and native drop
  listeners respectively. Layout and overlay markup lives in components.
- `components/file-table/FileTable.tsx` coordinates filtering and virtualization.
  `VirtualRow` measures row heights, `useScrollActivity` controls scroll
  placeholders, and `useFileTableActions` handles selection, deletion and keyboard
  shortcuts. The toolbar and status filters are separate presentation components.
- `components/file-table/row/` contains row interactions, status/progress display,
  expanded settings, and the context menu. `FileRow.tsx` composes these pieces.
- `components/settings/processing/` contains output format, per-format quality,
  and bitrate controls. `settings/naming/` contains block definitions, draggable
  blocks, and the add-block menu. `SettingsPanel` and `NamingConfig` coordinate
  their respective sections.
- `components/layout/useSidebar.ts` owns sidebar actions and queue summaries;
  `Sidebar.tsx` renders them.
- `store/queue/` groups queue actions into items, selection, processing,
  thumbnails, overrides, and session management. `persistence.ts` owns storage
  serialization and hydration; `itemIndex.ts` rebuilds the ID lookup. All actions
  still belong to one Zustand store, created in `queueStore.ts` with Immer and
  persistence middleware.
- `hooks/useConversionQueue.ts` controls queue execution and cancellation.
  `hooks/conversion/useConversionEvents.ts` subscribes to backend progress and
  completion events. `lib/conversion/buildRequest.ts` builds the Tauri request.
- `types/` separates media formats, naming, settings/defaults, queue/events, and
  quality definitions. `types/index.ts` exports the existing public API.

## Backend

- `commands.rs` is the public command facade. `commands/files.rs` handles file
  metadata/existence, `commands/thumbnails.rs` handles thumbnail commands, and
  `commands/sidecars.rs` resolves engine executable paths.
- `commands/conversion/mod.rs` validates requests, resolves conflicts, and routes
  processing. `copy.rs`, `video.rs`, and `image.rs` execute the existing copy,
  FFmpeg, and ImageMagick paths. `output_path.rs` applies output naming.
- `modules/ffmpeg.rs` exports the existing argument and progress helpers.
  `modules/ffmpeg/` separates the argument builder, encoding options, resize
  filters, and progress parsing.
- `types.rs` re-exports media types, conversion options/requests, and event/result
  payloads from `types/`. Serde field names and representations are unchanged.
- Process tracking, cancellation cleanup, naming, ImageMagick argument generation,
  and thumbnail filesystem helpers remain in their existing focused modules.

## Behavior checks

Run from the repository root:

```powershell
npm test
npm run build
cargo test --lib --locked --offline --manifest-path src-tauri/Cargo.toml
cargo build --locked --offline --manifest-path src-tauri/Cargo.toml
```

`npm test` compares this structural refactor with commit `c734d4b` using the actual
TypeScript sources and installed React, Zustand and Immer packages. It requires
that commit in the local Git history. No additional test dependency is required.
If an intentional behavior change is made later, review the corresponding
baseline assertions as part of that change.

Coverage includes all queue actions, saved-session hydration, 3,360 conversion
request combinations, rendered settings/row/application markup, moved handler
syntax trees, event effects, public defaults, and Rust function bodies.
Rust unit tests also cover codec/stream arguments, audio quality bounds, resize
filters, progress parsing, and thumbnail arguments.

The frontend harness substitutes storage, UUID/time generation and native OS
calls. Render comparisons check HTML, not browser layout or native dialogs;
they do not replace a desktop interaction check. The refactor retains command
names, event names/payloads, storage keys, defaults, and existing processing rules.

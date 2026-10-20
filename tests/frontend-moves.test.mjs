import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import { sourceAt, createRuntime, serializable } from "./helpers/source-runtime.mjs";

function parse(source) {
  return ts.createSourceFile("component.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}
function fingerprint(node) {
  if (ts.isParenthesizedExpression(node)) return fingerprint(node.expression);
  const children = [];
  ts.forEachChild(node, (child) => { children.push(fingerprint(child)); });
  return [node.kind, ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node) ? node.text : null, children];
}
function declarations(source) {
  const result = new Map();
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      result.set(node.name.text, fingerprint(node.initializer));
    }
    ts.forEachChild(node, visit);
  }
  visit(parse(source));
  return result;
}
function effects(source) {
  const result = [];
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "useEffect") {
      result.push(fingerprint(node));
    }
    ts.forEachChild(node, visit);
  }
  visit(parse(source));
  return result;
}

test("moved UI handlers retain their original syntax trees", () => {
  const groups = [
    ["src/App.tsx", ["src/hooks/useSessionRestore.ts", "src/hooks/useFileImport.ts", "src/hooks/useFileDrop.ts"]],
    ["src/components/file-table/FileTable.tsx", ["src/components/file-table/FileTable.tsx", "src/components/file-table/useFileTableActions.ts", "src/components/file-table/useScrollActivity.ts"]],
    ["src/components/file-table/FileRow.tsx", ["src/components/file-table/row/useFileRow.ts"]],
    ["src/components/settings/NamingConfig.tsx", ["src/components/settings/NamingConfig.tsx"]],
    ["src/components/layout/Sidebar.tsx", ["src/components/layout/useSidebar.ts"]],
  ];
  let count = 0;
  for (const [oldFile, files] of groups) {
    const before = declarations(sourceAt(oldFile, true));
    const after = new Map(files.flatMap((file) => [...declarations(fs.readFileSync(file, "utf8"))]));
    for (const [name, value] of before) if (/^(handle|triggerCooldown|toggleFilter|closePreview)/.test(name)) {
      assert.deepEqual(after.get(name), value, `${oldFile}: ${name}`);
      count++;
    }
  }
  assert.ok(count >= 25);
});

test("session, drag/drop, keyboard and conversion event effects are preserved", () => {
  for (const [oldFile, files] of [
    ["src/App.tsx", ["src/hooks/useSessionRestore.ts", "src/hooks/useFileImport.ts", "src/hooks/useFileDrop.ts"]],
    ["src/components/file-table/FileTable.tsx", ["src/components/file-table/VirtualRow.tsx", "src/components/file-table/useFileTableActions.ts"]],
    ["src/hooks/useConversionQueue.ts", ["src/hooks/conversion/useConversionEvents.ts"]],
  ]) {
    assert.deepEqual(files.flatMap((file) => effects(fs.readFileSync(file, "utf8"))), effects(sourceAt(oldFile, true)), oldFile);
  }
});

test("public type module values and supported formats retain their defaults", () => {
  const old = createRuntime({ baseline: true }).load("src/types/index.ts");
  const current = createRuntime().load("src/types/index.ts");
  assert.deepEqual(Object.keys(current).sort(), Object.keys(old).sort());
  for (const key of Object.keys(old)) if (typeof old[key] !== "function") {
    assert.deepEqual(serializable(current[key]), serializable(old[key]), key);
  }
  for (const extension of [...old.ALL_EXTENSIONS, "JPEG", ".MP4", "unknown"]) {
    assert.equal(current.getMediaType(extension), old.getMediaType(extension));
    assert.deepEqual(current.getQualityConfigForFormat(extension), old.getQualityConfigForFormat(extension));
  }
  for (const mediaType of ["video", "image", "audio"]) {
    assert.deepEqual(current.getAvailableOutputFormats(mediaType), old.getAvailableOutputFormats(mediaType));
    assert.equal(current.getDefaultOutputFormat(mediaType), old.getDefaultOutputFormat(mediaType));
  }
});

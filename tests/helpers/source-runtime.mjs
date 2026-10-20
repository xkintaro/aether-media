import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = process.cwd();
export const baselineRef = "c734d4b";
const baselineFiles = new Set(
  execFileSync("git", ["ls-tree", "-r", "--name-only", baselineRef], { encoding: "utf8" }).trim().split("\n"),
);
const sources = new Map();

export function sourceAt(file, baseline = false) {
  const key = `${baseline}:${file}`;
  if (!sources.has(key)) {
    sources.set(key, baseline
      ? execFileSync("git", ["show", `${baselineRef}:${file}`], { encoding: "utf8" })
      : fs.readFileSync(file, "utf8"));
  }
  return sources.get(key).replace(/\r\n/g, "\n");
}

// Load the actual TypeScript sources using the installed compiler. Only OS APIs,
// time, UUIDs and storage are substituted; React/Zustand/Immer remain real.
export function createRuntime({ baseline = false, persisted = {}, invoke, renderStores = false } = {}) {
  const cache = new Map();
  const storage = new Map(Object.entries(persisted));
  const calls = [];
  let id = 0;
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.localStorage = localStorage;
  class FixedDate extends Date {
    static now() { return 1_000_000; }
  }
  const mocks = {
    "@tauri-apps/api/core": {
      invoke: async (command, args) => {
        calls.push({ command, args });
        return invoke ? invoke(command, args) : undefined;
      },
      convertFileSrc: (value) => `asset:${value}`,
    },
    "@tauri-apps/api/event": { listen: async () => () => {} },
    "@tauri-apps/api/window": { getCurrentWindow: () => ({}) },
    "@tauri-apps/plugin-dialog": { open: async () => null },
    "@tauri-apps/plugin-opener": { revealItemInDir: async () => {} },
  };

  function load(file, overrideSource) {
    file = file.replaceAll("\\", "/");
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const compiled = ts.transpileModule(overrideSource ?? sourceAt(file, baseline), {
      fileName: file,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    const localRequire = (specifier) => {
      if (mocks[specifier]) return mocks[specifier];
      if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return require(specifier);
      const base = specifier.startsWith("@/")
        ? `src/${specifier.slice(2)}`
        : path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
      if (/\.(png|jpg|svg|css)$/.test(base)) return base;
      const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find((p) =>
        baseline ? baselineFiles.has(p) : fs.existsSync(path.join(root, p)) && fs.statSync(path.join(root, p)).isFile(),
      );
      if (!resolved) throw new Error(`Cannot resolve ${specifier} from ${file}`);
      return load(resolved);
    };
    new Function("require", "module", "exports", "localStorage", "crypto", "Date", compiled)(
      localRequire, module, module.exports, localStorage,
      { randomUUID: () => `test-id-${++id}` }, FixedDate,
    );
    if (renderStores && file.startsWith("src/store/")) {
      for (const [key, value] of Object.entries(module.exports)) {
        if (typeof value === "function" && value.getState) {
          module.exports[key] = Object.assign(
            (selector) => selector ? selector(value.getState()) : value.getState(), value,
          );
        }
      }
    }
    return module.exports;
  }
  return { load, storage, calls, localStorage };
}

export const serializable = (value) => JSON.parse(JSON.stringify(value, (_key, item) => {
  if (item instanceof Map) return [...item.entries()];
  if (item instanceof Set) return [...item];
  return item;
}));

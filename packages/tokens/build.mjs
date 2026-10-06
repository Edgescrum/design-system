/**
 * Style Dictionary ビルド。DTCG 形式の tokens/*.json から以下を生成する:
 *
 *   dist/css/tokens.css      — セマンティック層の :root 変数（peco の globals.css の
 *                              手書き :root ブロックと変数名・値が完全一致すること。
 *                              差し替え PR の検証条件が「画素差分ゼロ」であるため）
 *   dist/css/primitives.css  — プリミティブ層の :root 変数（参照・ドキュメント用。
 *                              アプリコードからの直接使用は禁止）
 *   dist/css/theme.css       — Tailwind v4 の @theme inline ブロック
 *                              （--color-* / --font-* / --text-* / --radius-*）
 *   dist/json/tokens.json    — 解決済みフラット JSON（機械用）
 *   dist/css/modes/<名>.css  — セマンティックのモード上書き（ADR 0026 Decision 3）。
 *                              modes/*.json（**tokens/ の外**）が無ければ 1 ファイルも作らない
 *
 * ★ 色値は hex と oklch() 文字列の両方がある（ステータス系は Tailwind v4 パレットの
 *   oklch をそのまま収載している — hex に変換すると v4 の描画と微差が出るため）。
 *   したがって色をパースする transform（color/css 等）は使わず、名前変換だけを行う。
 *
 * ★ **モードを 1 つも置かなければ上記 4 ファイルは 1 バイトも変わらない。**
 *   モード機構の導入 PR の検証条件がそれ（`verify.mjs` が確かめる）。
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";
import {
  MODES_DIR,
  TOKENS_SOURCE_GLOB,
  assertModeOverridesSemanticOnly,
  loadModes,
  renderModeCss,
} from "./modes.mjs";

/** 名前空間の判定。tokens/*.json のトップレベルキーが正 */
const ns = (token) => token.path[0];
const isPrimitiveColor = (token) => ns(token) === "color";
const isSemanticColor = (token) => !["color", "font", "text", "radius"].includes(ns(token));

const PASSTHROUGH_TRANSFORMS = ["attribute/cti", "name/kebab"];

const sd = new StyleDictionary({
  source: [TOKENS_SOURCE_GLOB],
  hooks: {
    formats: {
      /**
       * Tailwind v4 の @theme inline ブロック。peco の globals.css の既存
       * @theme inline と同じ対応（--color-X: var(--X)）を機械生成し、
       * フォント・追加 text 段・radius の役割トークンも同じブロックに載せる。
       */
      "peco/tailwind-theme": ({ dictionary }) => {
        const lines = [];
        for (const token of dictionary.allTokens) {
          if (isSemanticColor(token)) {
            lines.push(`  --color-${token.name}: var(--${token.name});`);
          } else if (ns(token) === "font") {
            const families = token.original.$value
              .map((f) => (f.includes(" ") ? `"${f}"` : f))
              .join(", ");
            lines.push(`  --font-${token.path[1]}: ${families};`);
          } else if (ns(token) === "text") {
            lines.push(`  --text-${token.path[1]}: ${token.$value};`);
          } else if (ns(token) === "radius") {
            lines.push(`  --radius-${token.path[1]}: ${token.$value};`);
          }
        }
        return `@theme inline {\n${lines.join("\n")}\n}\n`;
      },
    },
  },
  platforms: {
    "css-semantic": {
      transforms: PASSTHROUGH_TRANSFORMS,
      buildPath: "dist/css/",
      files: [
        {
          destination: "tokens.css",
          format: "css/variables",
          filter: isSemanticColor,
          options: { outputReferences: false },
        },
      ],
    },
    "css-primitives": {
      transforms: PASSTHROUGH_TRANSFORMS,
      buildPath: "dist/css/",
      files: [
        {
          destination: "primitives.css",
          format: "css/variables",
          filter: isPrimitiveColor,
          options: { outputReferences: false },
        },
      ],
    },
    "css-theme": {
      transforms: PASSTHROUGH_TRANSFORMS,
      buildPath: "dist/css/",
      files: [{ destination: "theme.css", format: "peco/tailwind-theme" }],
    },
    json: {
      transforms: PASSTHROUGH_TRANSFORMS,
      buildPath: "dist/json/",
      files: [{ destination: "tokens.json", format: "json/flat" }],
    },
  },
});

await sd.buildAllPlatforms();

// ---------------------------------------------------------------------------
// セマンティックのモード（ADR 0026 Decision 3）
// ---------------------------------------------------------------------------
// Style Dictionary の platform では書けない（1 トークン = 1 値の前提なので、
// 同じトークンに複数の値を持たせられない）。モードは差分だけの小さな CSS なので
// ここで直接書き出す。**モードが 0 件なら dist/css/modes/ も作らない。**
const HERE = dirname(fileURLToPath(import.meta.url));
const modes = await loadModes(MODES_DIR);

if (modes.length) {
  const semantic = JSON.parse(
    await readFile(join(HERE, "tokens", "color.semantic.json"), "utf8")
  );
  const primitives = JSON.parse(
    await readFile(join(HERE, "tokens", "color.primitives.json"), "utf8")
  );

  /** `{color.salmon.500}` → 実値。モードの値も既定と同じ解決規則を通す。 */
  const resolve = (value) => {
    if (!value.startsWith("{")) return value;
    const path = value.slice(1, -1).split(".");
    let node = path[0] === "color" ? primitives.color : semantic;
    for (const key of path[0] === "color" ? path.slice(1) : path) {
      node = node?.[key];
      if (!node) throw new Error(`参照が解決できません: ${value}`);
    }
    if (!("$value" in node)) throw new Error(`参照先がトークンではありません: ${value}`);
    return resolve(node.$value);
  };

  // 既定に実在するキーの集合（綴り違い・primitives 混入を拒否するため）
  const defaultKeys = new Set(Object.keys(flattenTokenPaths(semantic)));
  const outDir = join(HERE, "dist", "css", "modes");
  await mkdir(outDir, { recursive: true });
  for (const mode of modes) {
    assertModeOverridesSemanticOnly(mode, defaultKeys);
    await writeFile(join(outDir, `${mode.name}.css`), renderModeCss(mode, resolve), "utf8");
  }
  console.log(`modes: ${modes.map((m) => m.name).join(", ")}`);
}

/** DTCG ツリーのトークンパス（ドット区切り）を集める。 */
function flattenTokenPaths(node, path = [], out = {}) {
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (val && typeof val === "object" && "$value" in val) out[[...path, key].join(".")] = val;
    else if (val && typeof val === "object") flattenTokenPaths(val, [...path, key], out);
  }
  return out;
}

console.log("tokens built.");

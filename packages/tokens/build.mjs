/**
 * Style Dictionary ビルド。DTCG 形式の tokens/*.json から以下を生成する:
 *
 *   dist/css/tokens.css      — セマンティック層の :root 変数（peco の globals.css の
 *                              手書き :root ブロックと変数名・値が完全一致すること。
 *                              差し替え PR の検証条件が「画素差分ゼロ」であるため）。
 *                              末尾にページ余白 / 本文幅（--space-page-* / --size-content-*・
 *                              ADR 0027）を足した。既存の行は 1 バイトも変えていない
 *   dist/css/primitives.css  — プリミティブ層の :root 変数（参照・ドキュメント用。
 *                              アプリコードからの直接使用は禁止）
 *   dist/css/theme.css       — Tailwind v4 の @theme inline ブロック
 *                              （--color-* / --font-* / --text-* / --radius-* と、
 *                              ADR 0027 の --spacing-page-* / --container-content-*）
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
  LAYOUT_NAMESPACES,
  MODES_DIR,
  TOKENS_SOURCE_GLOB,
  assertModeOverridesSemanticOnly,
  loadModes,
  overridableKeys,
  renderModeCss,
} from "./modes.mjs";

/** 名前空間の判定。tokens/*.json のトップレベルキーが正 */
const ns = (token) => token.path[0];
const isPrimitiveColor = (token) => ns(token) === "color";
/** ページ余白 / 本文幅（ADR 0027）。:root に変数で出し、theme から var() で引く。 */
const isLayout = (token) => Object.hasOwn(LAYOUT_NAMESPACES, ns(token));
/**
 * ★ **「色以外の名前空間」を列挙して除外する方式なので、名前空間を足したら必ずここに足す。**
 *   以前は `!["color", "font", "text", "radius"].includes(…)` だけで、`space` / `size` を
 *   足した瞬間に `--color-space-page-block: var(--space-page-block)` が theme に出た
 *   （= `bg-space-page-block` という色ユーティリティが生える）。
 *   `verify.mjs` の `verify:layout-tokens` が「色として出ていないこと」を見ている。
 */
const NON_COLOR_NAMESPACES = ["color", "font", "text", "radius", ...Object.keys(LAYOUT_NAMESPACES)];
const isSemanticColor = (token) => !NON_COLOR_NAMESPACES.includes(ns(token));

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
          } else if (isLayout(token)) {
            // space.page.block → --spacing-page-block: var(--space-page-block)
            // size.content.admin → --container-content-admin: var(--size-content-admin)
            // 実値ではなく var() にするのはモードで差し替えられるようにするため（modes.mjs）
            const themeNs = LAYOUT_NAMESPACES[ns(token)];
            lines.push(`  --${themeNs}-${token.path.slice(1).join("-")}: var(--${token.name});`);
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
          // ページ余白 / 本文幅も :root に出す（theme が var() で引き、モードが差し替える）
          filter: (token) => isSemanticColor(token) || isLayout(token),
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
  const dimension = JSON.parse(await readFile(join(HERE, "tokens", "dimension.json"), "utf8"));

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

  // 既定に実在するキーの集合（綴り違い・primitives 混入を拒否するため）。
  // 色に加えて space / size（ADR 0027）も上書きできる。値は実値（"80rem"）なので resolve を素通りする
  const defaultKeys = overridableKeys(semantic, dimension);
  const outDir = join(HERE, "dist", "css", "modes");
  await mkdir(outDir, { recursive: true });
  for (const mode of modes) {
    assertModeOverridesSemanticOnly(mode, defaultKeys);
    await writeFile(join(outDir, `${mode.name}.css`), renderModeCss(mode, resolve), "utf8");
  }
  console.log(`modes: ${modes.map((m) => m.name).join(", ")}`);
}

console.log("tokens built.");

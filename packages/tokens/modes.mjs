/**
 * セマンティック層の**モード**（ADR 0026 Decision 3）。
 *
 * ## 何を解く機構か
 *
 * 判定表の第 3 カテゴリ「**構造は共通・値は個別**」の受け皿である。
 * 管理画面の幅 1280・アクセント色のように、**どのプロダクトも同じ役割の値を要るが
 * 値そのものはプロダクトで違う**ものを、共通層に置いたまま上書き可能にする。
 *
 * これが無い状態でシェル（`AdminShell` 等）を作ると **PeCo の数値が共通層に焼き付く**
 * ので、ADR の「順序の制約」でシェルより先に入れることになっている。
 *
 * ## 層とモードの対応（ADR 0026 Decision 3 の表）
 *
 * | 層 | モード | 理由 |
 * |---|---|---|
 * | primitives | **持たない** | 生のパレット。`red.500` はブランドが変わっても `red.500` |
 * | semantic | **持つ** | `accent` が何色かはブランドで変わる。参照先を差し替える |
 *
 * **primitives にモードを足さないこと。** `assertModeOverridesSemanticOnly()` が機械的に拒否する。
 *
 * ## ファイルの置き方
 *
 * **`modes/<mode>.json`（`tokens/` の外）** に**既定値と違うキーだけ**を書く。
 * 既定（= `color.semantic.json` の値）は `:root` にそのまま出るので、
 * **モードを 1 つも足さなければ生成物は 1 バイトも変わらない。**
 *
 *     modes/acme.json
 *     { "accent": { "$value": "{color.blue.700}" } }
 *
 * ★ **`tokens/` の中に置いてはならない。** Style Dictionary の source は
 *   `TOKENS_SOURCE_GLOB`（= `tokens/` 配下の全 json）なので、`tokens/modes/acme.json`
 *   に置くとモードファイルが**通常のトークンとして読まれ、既定の `:root` を
 *   上書きする**。実測（この機構の実装中に踏んだ）: `tokens/modes/acme.json` を
 *   置いた瞬間に `dist/css/tokens.css` の `--accent` が PeCo のサーモン `#f08c79` から
 *   青 `oklch(48.8% 0.243 264.376)` に変わった。
 *   **モードが 0 件のあいだは絶対に起きない**ので、最初のプロダクトがモードを
 *   足した日に PeCo の既定が壊れる、という形でしか現れない。
 *   置き場所を source の外に出し、`verify.mjs` が
 *   「source glob がモードディレクトリを覆っていないこと」を検査する。
 *
 * ## 生成される CSS
 *
 *     dist/css/tokens.css            :root { --accent: #f08c79; … }      ← 既定（全変数）
 *     dist/css/modes/acme.css        [data-ds-mode="acme"] { --accent: … } ← 差分のみ
 *
 * 消費側は属性を立てて使う:
 *
 *     <html data-ds-mode="acme">
 *     @import "@edgescrum/ds-foundation/css";
 *     @import "@edgescrum/ds-foundation/modes/acme.css";
 *
 * ★ **属性を立て忘れると既定（PeCo の値）のままになる。** これは画面を見れば
 *   すぐ分かる種類の間違い（ブランド色が違う）なので、黙って壊れる
 *   `@source` の罠（ADR 0026 作業 4）とは性質が違う。
 *
 * ## 既知の限界: モードは 1 軸しかない
 *
 * ダークモードを入れるときは**同じコレクションの別モード**になるため、
 * 「ブランド × 明暗」の 2 軸が必要になった時点で **モードの直積**
 * （`acme-light` / `acme-dark` …）か、コレクションを分ける判断が要る。
 * Figma の Variables も 1 コレクション = 1 軸なので制約は同じ。
 * **直積に入る前に ADR を書き直すこと**（層の上限と同じ理由で、組合せが増えると
 * Encore の "spider's web" を再現する）。
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** 既定モードの名前。Figma 側のモード名もこれに揃える。 */
export const DEFAULT_MODE = "Base";

/**
 * Style Dictionary の source glob。**build.mjs と verify.mjs が同じ 1 つを見る。**
 * 2 箇所に書くと、片方だけ広げたときに上の事故（モードが通常トークンとして
 * 読まれて既定を上書きする）が戻る。
 */
export const TOKENS_SOURCE_GLOB = "tokens/**/*.json";

/** モードファイルの置き場所（**`tokens/` の外**）。 */
export const MODES_DIR = join(HERE, "modes");

/**
 * **モードで上書きできる dimension の名前空間**と、Tailwind v4 の theme 名前空間の対応
 * （ADR 0027 Decision 1。`dimension.json` の `space.*` / `size.*`）。
 *
 * | トークン | :root の変数 | theme の変数 | 使えるユーティリティ |
 * |---|---|---|---|
 * | `space.page.block` | `--space-page-block` | `--spacing-page-block` | `py-page-block` / `pt-…` / `p-…` |
 * | `size.content.admin` | `--size-content-admin` | `--container-content-admin` | `max-w-content-admin` |
 *
 * theme 側は `--spacing-X: var(--space-X)` と **var() 経由**で出す（色の
 * `--color-X: var(--X)` と同じ形）。`@theme inline` はこの `var(--space-X)` を
 * ユーティリティにそのまま埋め込むので、**`[data-ds-mode]` で :root の変数を
 * 差し替えれば実行時に効く。**
 *
 * ★ **`text.*` / `radius.*` はここに入れない（= モードで上書きできない）。**
 *   この 2 つは theme に**実値**（`--radius-control: 0.75rem`）で出ており、
 *   `@theme inline` がその実値をユーティリティに焼き込む。モードで :root に
 *   `--radius-control` を出しても**どのユーティリティも読まない**ので、
 *   上書きできたように見えて何も変わらない。モード対象にしたくなったら、
 *   先に theme の出し方を var() 経由に変えること（既存の生成物が変わる = 別 PR）。
 */
export const LAYOUT_NAMESPACES = { space: "spacing", size: "container" };

/**
 * モードが上書きしてよいキーの集合（**build・verify・Figma payload が同じ 1 つを使う**）。
 * semantic の色すべて + `dimension.json` のうち `LAYOUT_NAMESPACES` の配下。
 *
 * @param {object} semanticJson tokens/color.semantic.json
 * @param {object} dimensionJson tokens/dimension.json
 * @returns {Set<string>} ドット区切りのトークンパス
 */
export function overridableKeys(semanticJson, dimensionJson) {
  const keys = new Set(Object.keys(flattenOverrides(semanticJson)));
  for (const namespace of Object.keys(LAYOUT_NAMESPACES)) {
    if (!dimensionJson[namespace]) continue;
    for (const key of Object.keys(flattenOverrides(dimensionJson[namespace]))) {
      keys.add(`${namespace}.${key}`);
    }
  }
  return keys;
}

/** `space.page.block` のようなキーが dimension（レイアウト）側のものか。 */
export const isLayoutKey = (key) => Object.hasOwn(LAYOUT_NAMESPACES, key.split(".")[0]);

/**
 * `modes/*.json` を読む。
 *
 * @param {string} [dir] 省略時は packages/tokens/modes
 * @returns {Promise<Array<{name: string, overrides: Record<string, {$value: string}>}>>}
 */
export async function loadModes(dir = MODES_DIR) {
  let names;
  try {
    names = await readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  const modes = [];
  for (const file of names.sort()) {
    if (!file.endsWith(".json")) continue;
    const name = file.slice(0, -".json".length);
    const raw = JSON.parse(await readFile(join(dir, file), "utf8"));
    modes.push({ name, overrides: flattenOverrides(raw) });
  }
  return modes;
}

/**
 * モードファイルの DTCG ツリーを `{"accent": {...}, "rating.1.bg": {...}}` に平坦化する。
 * キーは**ドット区切りのトークンパス**で、`color.semantic.json` と同じ綴り。
 */
export function flattenOverrides(node, path = [], out = {}) {
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (val && typeof val === "object" && "$value" in val) {
      out[[...path, key].join(".")] = val;
    } else if (val && typeof val === "object") {
      flattenOverrides(val, [...path, key], out);
    }
  }
  return out;
}

/**
 * **モードが上書きできるのは既定に実在する semantic のキー（色 + space / size）だけ**であることを検査する。
 *
 * 3 つの事故を止める:
 *
 * 1. **綴り間違いが黙って死ぬ** — `acccent` と書いても CSS 変数が 1 本増えるだけで、
 *    誰も使わないので気づけない。既定に無いキーは拒否する
 * 2. **primitives にモードが生える** — ADR 0026 Decision 3 が明示的に禁止している。
 *    `color.*` 名前空間のキーは拒否する
 * 3. **効かない上書き** — `text.*` / `radius.*` は theme に実値で焼き込まれるので、
 *    モードで変えても画面は変わらない（`LAYOUT_NAMESPACES` の注記）。拒否する
 *
 * @param {{name: string, overrides: object}} mode
 * @param {Set<string>} defaultKeys `overridableKeys()` の結果（semantic の色 + space / size）
 */
export function assertModeOverridesSemanticOnly(mode, defaultKeys) {
  const problems = [];
  for (const key of Object.keys(mode.overrides)) {
    if (key === "color" || key.startsWith("color.")) {
      problems.push(
        `  ${key} — primitives はモードを持たない（ADR 0026 Decision 3）。` +
          `semantic の役割トークン側を上書きすること`
      );
    } else if (key.startsWith("text.") || key.startsWith("radius.")) {
      problems.push(
        `  ${key} — text / radius は theme に実値で焼き込まれるので、モードで上書きしても` +
          `どのユーティリティにも効かない（modes.mjs の LAYOUT_NAMESPACES の注記）`
      );
    } else if (!defaultKeys.has(key)) {
      const near = [...defaultKeys].filter((k) => k.startsWith(key.split(".")[0])).slice(0, 3);
      problems.push(
        `  ${key} — 既定（color.semantic.json / dimension.json の space・size）に無いキー。綴り違いではないか` +
          (near.length ? `（近いもの: ${near.join(" / ")}）` : "")
      );
    }
  }
  if (problems.length) {
    throw new Error(
      `モード "${mode.name}" が上書きできないキーを含んでいます:\n${problems.join("\n")}`
    );
  }
}

/** モード 1 つぶんの CSS を組み立てる（差分のみ・属性セレクタ）。 */
export function renderModeCss(mode, resolve) {
  const lines = Object.entries(mode.overrides).map(([key, token]) => {
    const varName = key.split(".").join("-");
    return `  --${varName}: ${resolve(token.$value)};`;
  });
  return (
    `/**\n * モード "${mode.name}"（ADR 0026 Decision 3）。既定との差分だけを持つ。\n` +
    ` * 生成物。手で編集しないこと（modes/${mode.name}.json が正）。\n */\n` +
    `[data-ds-mode="${mode.name}"] {\n${lines.join("\n")}\n}\n`
  );
}

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
 *
 * ★ 色値は hex と oklch() 文字列の両方がある（ステータス系は Tailwind v4 パレットの
 *   oklch をそのまま収載している — hex に変換すると v4 の描画と微差が出るため）。
 *   したがって色をパースする transform（color/css 等）は使わず、名前変換だけを行う。
 */
import StyleDictionary from "style-dictionary";

/** 名前空間の判定。tokens/*.json のトップレベルキーが正 */
const ns = (token) => token.path[0];
const isPrimitiveColor = (token) => ns(token) === "color";
const isSemanticColor = (token) => !["color", "font", "text", "radius"].includes(ns(token));

const PASSTHROUGH_TRANSFORMS = ["attribute/cti", "name/kebab"];

const sd = new StyleDictionary({
  source: ["tokens/**/*.json"],
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
console.log("tokens built.");

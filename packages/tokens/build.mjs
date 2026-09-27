/**
 * Style Dictionary ビルド。DTCG 形式の tokens/*.json から以下を生成する:
 *
 *   dist/css/tokens.css      — セマンティック層の :root 変数（peco の globals.css の
 *                              手書き :root ブロックと変数名・値が完全一致すること。
 *                              差し替え PR の検証条件が「画素差分ゼロ」であるため）
 *   dist/css/primitives.css  — プリミティブ層の :root 変数（参照・ドキュメント用。
 *                              アプリコードからの直接使用は禁止）
 *   dist/css/theme.css       — Tailwind v4 の @theme inline ブロック
 *                              （--color-<semantic名> と --font-<名>）
 *   dist/json/tokens.json    — 解決済みフラット JSON（Figma 同期スクリプト等の機械用）
 */
import StyleDictionary from "style-dictionary";

/** セマンティック層 = パスが color.（プリミティブ）でも font.（タイポ）でもないトークン */
const isSemantic = (token) => token.path[0] !== "color" && token.path[0] !== "font";
const isPrimitiveColor = (token) => token.path[0] === "color";

const sd = new StyleDictionary({
  source: ["tokens/**/*.json"],
  hooks: {
    formats: {
      /**
       * Tailwind v4 の @theme inline ブロック。peco の globals.css の既存
       * @theme inline と同じ対応（--color-X: var(--X)）を機械生成する。
       */
      "peco/tailwind-theme": ({ dictionary }) => {
        const lines = [];
        for (const token of dictionary.allTokens) {
          if (isSemantic(token)) {
            lines.push(`  --color-${token.name}: var(--${token.name});`);
          } else if (token.path[0] === "font") {
            const families = token.original.$value
              .map((f) => (f.includes(" ") ? `"${f}"` : f))
              .join(", ");
            lines.push(`  --font-${token.path[1]}: ${families};`);
          }
        }
        return `@theme inline {\n${lines.join("\n")}\n}\n`;
      },
    },
  },
  platforms: {
    "css-semantic": {
      transformGroup: "css",
      buildPath: "dist/css/",
      files: [
        {
          destination: "tokens.css",
          format: "css/variables",
          filter: isSemantic,
          options: { outputReferences: false },
        },
      ],
    },
    "css-primitives": {
      transformGroup: "css",
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
      transformGroup: "css",
      buildPath: "dist/css/",
      files: [{ destination: "theme.css", format: "peco/tailwind-theme" }],
    },
    json: {
      transformGroup: "js",
      buildPath: "dist/json/",
      files: [{ destination: "tokens.json", format: "json/flat" }],
    },
  },
});

await sd.buildAllPlatforms();
console.log("tokens built.");

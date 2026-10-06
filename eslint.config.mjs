/**
 * 層の向きを機械で固定する（ADR 0026 §9-3 / §9-8）。
 *
 * **宣言だけでは守られない。** 「emerald を green に統一する」が
 * `color.primitives.json` の `$description` に書かれたまま 79 行が 9 日間残った実例
 * （peco #2500）があるので、§9 の規則はすべて検査とセットで入れる。
 *
 * 層の定義・向き・パターンの生成は **`layers.mjs` が唯一の正**（ここには書かない）。
 * 規則が実際に発火することは `packages/ui/verify.mjs` が
 * **ESLint を呼び出す標本テスト**で確かめている —— local のディレクトリは
 * まだ空（最初のシェルは作業 6）なので、**標本が無いと規則は 1 度も実行されないまま
 * 腐る**（作業 3 で「Figma の既定モード名を付けるコードが空のループだった」のと同型）。
 */
import tsParser from "@typescript-eslint/parser";
import {
  AUDIENCES,
  RETIRED_PACKAGE_PATTERNS,
  forbiddenPatternsFor,
  localDir,
} from "./layers.mjs";

const TS = {
  files: ["**/*.{ts,tsx,mts,mjs}"],
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
  },
};

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/storybook-static/**"],
  },

  // ── core 層: packages/ui/src 直下。local のどれも見てはいけない ───────────────
  {
    ...TS,
    files: ["packages/ui/src/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [...forbiddenPatternsFor("core"), ...RETIRED_PACKAGE_PATTERNS] },
      ],
    },
  },

  // ── local 層: オーディエンスごとに、他のオーディエンスを見てはいけない ──────────
  ...AUDIENCES.map((audience) => ({
    ...TS,
    files: [`packages/ui/src/${localDir(audience)}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...forbiddenPatternsFor(`local:${audience}`),
            ...RETIRED_PACKAGE_PATTERNS,
          ],
        },
      ],
    },
  })),

  // ── foundation 層: core に依存してはいけない（minimum bar が core を連れてくる） ──
  {
    ...TS,
    files: ["packages/tokens/**/*.{ts,mjs}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [...forbiddenPatternsFor("foundation"), ...RETIRED_PACKAGE_PATTERNS] },
      ],
    },
  },

  // ── カタログ（Storybook）: 旧名の封鎖だけ ───────────────────────────────────
  {
    ...TS,
    files: ["apps/storybook/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: RETIRED_PACKAGE_PATTERNS }],
    },
  },
];

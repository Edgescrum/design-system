import { defineConfig } from "vitest/config";

/**
 * 部品の振る舞いの単体テスト（開閉・キー操作・読み上げの属性）。
 *
 * 見た目の DOM の固定（「peco の今日の描画と 1 バイトも変わらない」等）は
 * `verify.mjs` が dist を描画して見ている。ここは**操作して状態が変わる**ものだけを置く
 * （サーバー描画の文字列比較では押す・Esc・外側を押すを試せないため）。
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.tsx"],
  },
});

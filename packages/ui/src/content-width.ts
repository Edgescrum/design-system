/**
 * 本文の最大幅（ADR 0027 / `ds-foundation` の `size.content.*`）を Tailwind のクラスに引く表。
 * **`PageBody` と `AppBar` が同じ 1 つを使う**ので、ヘッダーと本文の左右は必ず揃う。
 *
 * peco の `public-page-width.ts` が #1281 で解いたのと同じ問題 —— 本文とヘッダー（フッター）が
 * 幅を別々に持つと、片方だけ変えたときに取り残される —— を DS の側で構造的に塞ぐ。
 *
 * | width | PC の実効幅 | トークン | 使う画面 |
 * |---|---|---|---|
 * | `admin` | 1280px | `size.content.admin` | 事業主の管理画面 |
 * | `narrow` | 672px | `size.content.narrow` | 文章を読ませる・設定を並べる |
 * | `flow` | 896px（sm 未満は 512px） | `size.content.flow` / `flow-compact` | 予約・回答フローなど 1 列の集中画面 |
 * | `wide` | 1024px | `size.content.wide` | 一覧・カードの並び |
 * | `lp` | 1152px | `size.content.lp` | ランディングページ |
 *
 * ★ **クラスは完全な文字列で書くこと**（テンプレートで `max-w-content-${w}` と組まない）。
 *   Tailwind はソースを文字列として走査するだけなので、組み立てたクラスは生成されず、
 *   **型エラーもビルドエラーも出ないまま幅だけが消える。**
 *
 * ★ `flow` だけ 2 段なのは peco の現行（`max-w-lg sm:max-w-4xl`）をそのまま写したため。
 *   横向きの端末・折りたたみ（sm 未満だが 512px より広い）で 1 行が伸びすぎるのを防いでいる。
 */
export const CONTENT_WIDTH_CLASS = {
  admin: "max-w-content-admin",
  narrow: "max-w-content-narrow",
  flow: "max-w-content-flow-compact sm:max-w-content-flow",
  wide: "max-w-content-wide",
  lp: "max-w-content-lp",
} as const;

/** 本文の最大幅の種類。実値はトークン（`size.content.*`）が持ち、モードで差し替わる。 */
export type ContentWidth = keyof typeof CONTENT_WIDTH_CLASS;

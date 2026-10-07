import type { ReactNode } from "react";
import { cx } from "./cx";
import { CONTENT_WIDTH_CLASS, type ContentWidth } from "./content-width";

/** `data-page-full` のような `data-*` 属性だけを受け取るための型。 */
export type DataAttributes = {
  [key: `data-${string}`]: string | number | boolean | undefined;
};

export type PageBodyProps = {
  children: ReactNode;
  /**
   * 本文の最大幅。既定の `"none"` は**親が幅を持つ**（事業主画面は layout の幅ラッパが
   * 1280px を持ち、その中に置く）。値を渡すと `mx-auto w-full max-w-…` が付く。
   */
  width?: "none" | ContentWidth;
  /** 縦の flex コンテナの中で残りの高さを埋める（`flex-1`）。フッターを下端に押すとき */
  fill?: boolean;
} & DataAttributes;

/**
 * ページ本文。**`<main>` と本文の余白の唯一の持ち主**（ADR 0027 Decision 1 / 6）。
 *
 * ## なぜ `className` を受け取らないのか
 *
 * 2026-10-07 の全画面の実測で、**`<main>` を書いているのは約 60 個の page.tsx 自身**で、
 * そのうち 30 ファイルが `bg-background px-4 py-6 sm:px-8 sm:py-8` を完全一致でコピーしていた。
 * 揃って見えていたのは設計ではなくコピーの結果で、ずれた画面（タブが消えても `pt-4` の代償だけが
 * 残った `profile/shift` など）は**ページが自分で余白を書けたこと**から生まれた。
 *
 * `className` を開けると、その逃げ道がそのまま戻る。余白は `space.page.*` の 1 値だけで、
 * **ページは `pt` を書かない**（§9-11「ページがしてはいけないこと」）。
 * 本文の中身のレイアウト（grid・gap）は `<PageBody>` の**子**に書くこと。
 *
 * ## `data-*` を通す理由
 *
 * peco は `<main>` の属性で親 layout に宣言を伝えている（`data-page-full` を見て
 * layout の幅ラッパが `has-[[data-page-full]]:max-w-none` で全幅になる）。
 * 見た目のクラスではなく**宣言**なので通す。それ以外の属性は通さない。
 *
 * ## 値
 *
 * | | sm 未満 | sm 以上 | トークン |
 * |---|---|---|---|
 * | 上下 | 24px | 32px | `space.page.block` / `block-sm` |
 * | 左右 | 16px | 32px | `space.page.inline` / `inline-sm` |
 *
 * peco の現行 `px-4 py-6 sm:px-8 sm:py-8` と同じ値。プロダクトで変えたいときはモードで差し替える
 * （`packages/tokens/modes/README.md`）。
 */
export function PageBody({ children, width = "none", fill = false, ...rest }: PageBodyProps) {
  return (
    <main
      {...pickDataAttributes(rest)}
      className={cx(
        "bg-background px-page-inline py-page-block sm:px-page-inline-sm sm:py-page-block-sm",
        width !== "none" && `mx-auto w-full ${CONTENT_WIDTH_CLASS[width]}`,
        fill && "flex-1"
      )}
    >
      {children}
    </main>
  );
}

/**
 * `data-*` 以外を落とす。型は `DataAttributes` で絞ってあるが、JS から呼ばれたときや
 * `as any` で `className` / `style` を押し込まれたときに**余白の逃げ道にならない**ようにする。
 */
export function pickDataAttributes(props: Record<string, unknown>): DataAttributes {
  const out: DataAttributes = {};
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("data-")) out[key as `data-${string}`] = value as DataAttributes[`data-${string}`];
  }
  return out;
}

import type { ReactNode } from "react";
import { cx } from "./cx";
import { CONTENT_WIDTH_CLASS, type ContentWidth } from "./content-width";

/**
 * 戻るボタン（アイコンだけの 32px 四方）のクラス。`AppBar` の `back` に渡す要素に付ける。
 *
 * ```tsx
 * <AppBar back={<Link href="/home" className={APP_BAR_BACK_CLASS} aria-label="戻る"><ChevronLeftIcon size={20} /></Link>} />
 * ```
 *
 * DS がリンクそのものを描かないのは、**DS は `next/link` を import できない**から
 * （フレームワーク非依存の core 層）。peco の戻るは `useSmartBack`（履歴があれば来た道を戻る）
 * とも結合しており、これは履歴設計 = プロダクトの責務（`TabLink` を DS に入れなかったのと同じ理由）。
 * **クラスだけを DS が持つ**ので、11 箇所にあった同じ綴りのコピーはこの定数 1 つに寄る。
 */
export const APP_BAR_BACK_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg";

/** `AppBar` の画面名の最大行数。 */
export type AppBarTitleLines = 1 | 2;

/**
 * 画面名 `<h1>` のクラス（行数ごと）。
 *
 * - `1` は従来の綴りのまま（**既定の DOM は 1 バイトも変わらない**。`verify.mjs` が描画して比べる）
 * - `2` は peco の #948 ② の旧 `<h1 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold
 *   leading-tight">` と同じクラスの集合（並びだけ `1` に揃えた）。`line-clamp-2` が
 *   `display: -webkit-box` にするので、flex item のまま 2 行で折り返す。`truncate` を外すので
 *   `whitespace-normal` の打ち消しは要らない
 */
const TITLE_CLASS: Record<AppBarTitleLines, string> = {
  1: "min-w-0 flex-1 truncate text-base font-semibold",
  2: "min-w-0 flex-1 line-clamp-2 text-base font-semibold leading-tight",
};

type AppBarCommon = {
  /** 左端。戻るリンクなど（`APP_BAR_BACK_CLASS` を付けた完成形を渡す） */
  back?: ReactNode;
  /** 右端に置く要素 */
  right?: ReactNode;
  /**
   * 内側の最大幅。**本文（`PageBody`）と同じ値を渡す**とヘッダーと本文の左右が揃う。
   * 既定 `flow`（peco の `CustomerPageHeader` の既定と同じ）。
   */
  width?: "none" | ContentWidth;
  /**
   * `<header>` に足すクラス。**レスポンシブの出し分け専用**（例: 事業主画面のモバイルヘッダーの
   * `sm:hidden`）。見た目の上書きに使わないこと —— AppBar の綴りが 11 箇所でコピーされ、
   * 少しずつずれていったのを 1 つに寄せるための部品なので。
   */
  className?: string;
};

export type AppBarProps = AppBarCommon &
  (
    | {
        /** 画面名。`<h1>` で描く（残りの幅を埋め、溢れたら `titleLines` に従って切る） */
        title?: ReactNode;
        /**
         * 画面名の最大行数。既定 `1`（1 行 + 省略記号）。
         *
         * `2` は**最大 2 行で折り返し、溢れたら 2 行目の末尾で省略**する（行の高さは `leading-tight`
         * = 20px なので、1 行のとき 20px・2 行のとき 40px）。事業主画面のモバイルヘッダー用
         * （peco #948 ②）—— モバイルでは本文の `<h1>` が `hidden sm:block` のことが多く、
         * **このヘッダーが唯一の画面名表示**になるので「マイプロフ…」と切れると現在地が分からなくなる。
         *
         * ★ `title` に `<span className="line-clamp-2 …">` を渡して 2 行にしないこと（peco #2572）。
         *   `<h1>` の `truncate` の `white-space: nowrap` が継承されるので打ち消しが要り、
         *   部品の外から仕様を上書きする形になる。行数はこの prop で決める。
         */
        titleLines?: AppBarTitleLines;
        logo?: never;
      }
    | {
        /**
         * 画面名の代わりにブランドマーク（規約・問い合わせなど）。寸法込みの完成形を渡す。
         * ブランドマークは product 層が持つ（ADR 0026。`FullScreenLoading` の `logo` と同じ）
         */
        logo: ReactNode;
        title?: never;
        titleLines?: never;
      }
  );

/**
 * 画面上部の sticky ヘッダー（ADR 0027 Decision 1）。戻る / 画面名かロゴ / 右スロット。
 *
 * ## なぜ core に置くか
 *
 * 事業主画面のモバイルヘッダーとお客さま向けのヘッダーが**同一のクラス列**で、
 * audience では違いを説明できない。最初から audience 非依存で生まれた部品なので core に置く
 * （ADR 0026 の「2 プロダクト規則」は local → core の**昇格**を縛るもので、これには当たらない）。
 *
 * ## マークアップ
 *
 * peco の `CustomerPageHeader` を写した。左右余白だけ `space.page.inline*` に置き換えてあり、
 * 値は同じ（16px / sm 以上 32px）。**本文（`PageBody`）と同じトークン**なので、ヘッダーの
 * 戻るボタンの左端と本文の左端は必ず揃う。
 *
 * ★ **背景が半透明（`bg-card/80` + `backdrop-blur-lg`）なので、下にスクロールした本文が
 *   透けて見えるのは仕様。** 不透明にしたくなっても、ここではなく Figma で裁定してから変えること。
 */
export function AppBar({
  back,
  title,
  titleLines = 1,
  logo,
  right,
  width = "flow",
  className,
}: AppBarProps) {
  return (
    <header
      className={cx(
        "sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg",
        className
      )}
    >
      <div
        className={cx(
          "mx-auto flex w-full",
          width !== "none" && CONTENT_WIDTH_CLASS[width],
          "items-center gap-3 px-page-inline py-3 sm:px-page-inline-sm"
        )}
      >
        {back}
        {title ? <h1 className={TITLE_CLASS[titleLines]}>{title}</h1> : null}
        {/* ロゴは h1 と同じく残りの幅を埋める（右スロットを右端に押すため） */}
        {logo ? <div className="flex min-w-0 flex-1 items-center">{logo}</div> : null}
        {right}
      </div>
    </header>
  );
}

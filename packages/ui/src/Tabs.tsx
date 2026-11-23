"use client";

/**
 * 画面上部の「タブ」の共通実装 (Issue #893)。
 *
 * それまで同じ見た目のタブバーが 3 箇所 (店舗設定 / メニュー / プレビュー) に
 * コピペされ、さらに `TabFilter` (分析・口コミ) だけ別デザインという状態だった。
 * 見た目とマークアップをこのファイル 1 箇所に集約し、各画面はここに寄せる。
 *
 * ## 使い分け
 *
 * | 用途 | コンポーネント |
 * |---|---|
 * | ページ遷移で切り替わるタブ (URL が変わる) | `PageTabBar` / `TabBar` + アプリ側の `TabLink` |
 * | 同一ページ内で表示を切り替えるタブ | `TabList` + `TabButton` |
 * | `{ key, label, count }` の配列から一括で描く | `TabFilter` |
 *
 * ## パッケージ昇格時の設計変更 (2026-09-28)
 *
 * **`TabLink` はこのパッケージに含めない。** peco 本体の `TabLink` は
 * `next/link` の `replace` 遷移と履歴深さ管理 (`markReplaceNavigation`) に
 * 密結合しており (#1423)、これは「アプリの履歴設計」であってデザインシステムの
 * 責務ではない。アプリ側は `tabItemClass()` + `TabUnderline` を使って
 * 自前の `TabLink` を組むこと (peco では `src/components/Tabs.tsx` に残る)。
 *
 * `PageTabBar` は (既定の `placement="above-body"` では) ページ本文と同じ横 padding
 * (`px-4 sm:px-8`) を内包するので、最左タブの左端が見出し・カードの左端と揃う
 * (#540 round 6 の調整をそのまま踏襲)。`PageBody` の中に置く `placement="in-body"` は
 * `PageTabBar` 本体の docstring を参照。
 * 本文の中に埋め込む場合 (すでに padding 済みの領域) は `TabBar` / `TabList` を使う。
 *
 * ## ARIA: なぜ入れ物が 2 種類あるのか
 *
 * `TabButton` は `role="tab"` を持つので、**`role="tablist"` を持つ親が必須**
 * (WAI-ARIA `aria-required-parent` / axe の同名ルール)。そのため
 * `TabButton` を並べる入れ物は `TabList` に分けてあり、`TabList` が
 * ボタンの直接の親に `role="tablist"` を付ける。
 *
 * 逆にリンクのタブは `<a href>` で、押すと**ページ遷移する**ただのリンクである。
 * `role="tab"` を名乗ると「同一ページ内でパネルを切り替える」という嘘になるので
 * role を付けず、したがって親も `tablist` にしない (`TabBar` / `PageTabBar`)。
 * リンクの現在地は `aria-current="page"` で表す。
 *
 * `TabButton` の `type="button"` は、フォームの内側に置かれたときに
 * 暗黙の submit にならないようにするため (#901 で移行候補に挙げた
 * `class-service-form.tsx` の「開催形式」は実際に `<form>` の内側にある)。
 *
 * ## 見た目の種類: `variant`（#60・2026-11-23 運用者裁定）
 *
 * | variant | 見た目 | 何を切り替えるか |
 * |---|---|---|
 * | `"underline"`（既定） | 1 行 + 選択中の下線 | **中身そのもの**（店舗設定の基本情報 / 外観 …・分析・口コミ） |
 * | `"segmented"` | 角丸の枠 + 選択中の塗り | 同じ中身の**見方・立場**を 2〜3 択で（/try の「お客さま / 事業主」） |
 *
 * 新部品（SegmentedControl）にしなかったのは、役割と ARIA（`tablist` / `tab`、
 * リンクなら `aria-current="page"`）が同じで、違うのは見た目だけだから。
 * 別部品にすると #893 で 1 つにまとめた ARIA の書き方が 2 通りに戻る。
 *
 * #893 で `TabFilter` のピル型を外した経緯は変わらない: **中身を切り替えるタブは下線型**。
 * 使い分けの約束は `Tabs.design.md`。
 *
 * - `TabList` の `variant` / `size` / `fullWidth` は Context で `TabButton` に届く
 *   （ボタン 1 つずつに渡させない）
 * - `TabBar`（リンク版）の子はアプリ側の `TabLink` なので Context は読まれない。
 *   アプリは `tabItemClass(isActive, "segmented", { size, fullWidth })` を自分で呼ぶ
 * - `size` / `fullWidth` は `"segmented"` のときだけ効く。`"underline"` では無視する
 *
 * ## ベースライン
 *
 * peco 側の `existing-plan-nav-dom.baseline.json` が店舗設定タブ / プレビュー画面の
 * innerHTML を **バイト単位** で固定している (#853 / #861)。
 * ここの DOM を変えるときは、**どのキーがなぜ変わるのかを PR 本文に書いたうえで**
 * ベースラインを更新すること (無言の更新はこの回帰テストを無力化する)。
 * `variant` を足したあとも、**既定（`"underline"`）の DOM は 1 バイトも変えていない**
 * （`verify.mjs` の `verify:tabs` が追加前の文字列で固定している）。
 */

import { createContext, useContext, type ReactNode } from "react";

/** タブの見た目。既定は `"underline"`（従来どおり）。使い分けは `Tabs.design.md`。 */
export type TabVariant = "underline" | "segmented";

/** `"segmented"` の大きさ。`sm` = 1 行に他の操作と並べる小さな切り替え / `md` = 高さ 40px・幅 120px 以上。 */
export type TabSize = "sm" | "md";

/** `"segmented"` だけが読む寸法の指定。`"underline"` では無視する。 */
export interface TabSegmentedOptions {
  /** 既定 `"md"`（Figma の ModeSwitch と同じ 40px） */
  size?: TabSize;
  /** 横幅いっぱいにして項目を等分する（スマホで画面幅に揃えるとき）。既定 false */
  fullWidth?: boolean;
}

/** タブ 1 つ分の共通クラス (状態に依らない部分)。 */
export const TAB_ITEM_BASE_CLASS =
  "relative flex flex-1 items-center justify-center whitespace-nowrap py-2.5 text-center text-xs font-medium transition-colors sm:text-sm";

/**
 * セグメント型のタブ 1 つ分の共通クラス (状態・大きさに依らない部分)。
 * 色・文字・角丸・動きはすべてトークン（任意値を書かない）。
 */
const SEGMENTED_ITEM_BASE_CLASS =
  "flex items-center justify-center whitespace-nowrap rounded-full font-emphasis transition-colors duration-feedback ease-productive-standard";

const SEGMENTED_ITEM_SIZE_CLASS: Record<TabSize, string> = {
  // peco のスケジュールの月 / 週（#901 で手組みのまま残すもの）と同じ大きさの帯
  sm: "px-4 py-1 text-role-help sm:px-5 sm:text-role-body",
  // Figma の ModeSwitch（ボタン 120×40）
  md: "h-10 min-w-30 px-4 text-role-body",
};

/**
 * タブ 1 つ分のクラス (アクティブ状態込み)。
 *
 * 第 2 引数を省略した（= `"underline"`）ときの戻り値は従来と 1 文字も変わらない。
 * リンクのタブ（アプリ側の `TabLink`）をセグメント型にするときは
 * `TabBar variant="segmented"` と同じ `variant` / `size` / `fullWidth` をここにも渡す。
 */
export function tabItemClass(
  isActive: boolean,
  variant: TabVariant = "underline",
  options: TabSegmentedOptions = {},
): string {
  if (variant === "segmented") {
    const { size = "md", fullWidth = false } = options;
    return [
      SEGMENTED_ITEM_BASE_CLASS,
      SEGMENTED_ITEM_SIZE_CLASS[size],
      fullWidth ? "flex-1" : "",
      isActive ? "bg-accent text-on-accent" : "text-muted hover:text-foreground",
    ]
      .filter(Boolean)
      .join(" ");
  }
  return `${TAB_ITEM_BASE_CLASS} ${
    isActive ? "text-foreground" : "text-muted hover:text-foreground"
  }`;
}

/** セグメント型の入れ物（枠）のクラス。`TabList` と `TabBar` で共有する。 */
function segmentedTrackClass(fullWidth: boolean): string {
  return `${fullWidth ? "flex w-full" : "inline-flex"} gap-0.5 rounded-full bg-card p-1 ring-1 ring-border`;
}

interface TabStyle extends TabSegmentedOptions {
  variant: TabVariant;
}

/** `TabList` → `TabButton` に見た目を届ける。既定は従来の下線型。 */
const UNDERLINE_STYLE: TabStyle = { variant: "underline" };
const TabStyleContext = createContext<TabStyle>(UNDERLINE_STYLE);

/**
 * アクティブタブの下線。アプリ側で独自のタブ項目 (リンク等) を組むときに
 * `tabItemClass()` と併せて使う (パッケージ昇格で export 化。中身は不変)。
 */
export function TabUnderline() {
  return (
    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent" />
  );
}

/**
 * **リンクのタブバー** (下線付きの 1 行)。子はアプリ側の `TabLink` を並べる。
 *
 * `role="tablist"` は付けない (子は `role="tab"` ではなくページ遷移するリンク)。
 * 同一ページ内で切り替えるタブが欲しい場合は `TabList` を使うこと。
 */
export function TabBar({
  children,
  variant = "underline",
  fullWidth = false,
}: {
  children: ReactNode;
  /**
   * 見た目。既定 `"underline"`（従来どおり・DOM は変わらない）。
   * `"segmented"` にしたら、子の `TabLink` も `tabItemClass(isActive, "segmented", …)` を使うこと。
   */
  variant?: TabVariant;
  /** `"segmented"` のときだけ効く。横幅いっぱいにする（子にも `fullWidth` を渡す） */
  fullWidth?: boolean;
}) {
  if (variant === "segmented") {
    // role は付けない（子はページ遷移するリンク。現在地は aria-current="page"）
    return <div className={segmentedTrackClass(fullWidth)}>{children}</div>;
  }
  return (
    <div className="border-b border-border">
      {/*
        `overflow-x-auto`: タブが 1 行に収まらない幅では、**ページではなくタブバーが**
        横スクロールする（#2266）。

        タブは `flex-1` + `whitespace-nowrap` なので、**中身の幅より縮まない**。
        入れ物がスクロールしないと、はみ出した分がそのままページの横スクロールになる。
        店舗設定に 5 つ目のタブ（支払い方法）を足した時点で、**320px で 19px の
        横あふれ**が実測された（`tab-bar-overflow-2266.spec.ts` が固定している）。
        320px は `e2e/customer-flow-width-1742.spec.ts` が「実機の下限帯」として
        横スクロール無しを要求している幅。

        収まる幅（375px 以上）では `flex-1` が従来どおり等分するので**見た目は変わらない**
        （スクロールバーも出ない）。#2226 / #2227 が公開ページのカテゴリタブに入れた
        「1 行 + 横スクロール」と同じ扱い。
      */}
      <div className="flex gap-0 overflow-x-auto">{children}</div>
    </div>
  );
}

/**
 * ページ最上部に置くリンクのタブバー。
 *
 * ## `placement` — 余白をどちらが持つか（ADR 0027 Decision 6）
 *
 * | placement | 置き場所 | 上 / 左右の余白 | 下の余白 |
 * |---|---|---|---|
 * | `"above-body"`（既定） | `<main>` の**外**（兄） | **自分で持つ**（`px-4 pt-6 sm:px-8 sm:pt-8`） | 持たない → ページが `pt-4 sm:pt-6` で代償する |
 * | `"in-body"` | `PageBody` の**中**（先頭） | `PageBody` が持つ（`space.page.*`） | **自分で持つ**（`pb-4 sm:pb-6`） |
 *
 * 既定の `"above-body"` は従来どおりで、**DOM も見た目も 1 バイトも変わらない**
 * （peco の `existing-plan-nav-dom.baseline.json` がバイト単位で固定している）。
 *
 * ### なぜ `"in-body"` が要るか
 *
 * `"above-body"` では**帯（タブ）を描く側が自分の下の余白を持っていない**ので、
 * 下に続く本文の上余白（24 / 32px）が広すぎ、ページが `pt-4 sm:pt-6` を書いて詰めている。
 * この代償は**タブが消えても残る**（peco の `profile/shift` は `ProfileTabs` が `null` を
 * 返すのに `pt-4` だけが残っていた）し、**タブを一度も持たないページにも綴りだけコピーされる**
 * （`invoices/payment-methods`）。ADR 0027 の裁定は「本文の上余白は `space.page.*` の 1 値だけ。
 * 帯を足す部品は自分の下の余白も持つ（帯が消えたら代償も一緒に消える）」。
 *
 * `"in-body"` にすると縦の並びは
 * `PageBody の上余白（24 / 32）→ タブ → タブの下余白（16 / 24）→ 本文` になり、
 * **今日の `"above-body"` + ページの `pt-4 sm:pt-6` と画素単位で同じ**になる
 * （タブの上: 24 / 32、タブの下: 16 / 24）。違うのは、**ページが何も書かなくてよい**こと。
 *
 * ★ 下の余白を margin ではなく **padding** で持つのは、margin だと本文の先頭要素の
 *   `mt-*` と**相殺**（大きい方だけが残る）して、ページの `pt-4` が担っていた「足し算」と
 *   値が変わるから。padding は相殺しない。
 *
 * ★ `"in-body"` は**左右の余白も `PageBody` に任せる**ので、`PageBody` の外に置くと
 *   タブの左端が本文より 16 / 32px 左にはみ出る。外に置くなら既定の `"above-body"` を使う。
 *
 * peco は ADR 0027 の 6b（AdminShell が `PageBody` を layout に引き上げる段）でこちらへ切り替える。
 */
export function PageTabBar({
  children,
  placement = "above-body",
}: {
  children: ReactNode;
  /** 余白をどちらが持つか。既定 `"above-body"`（従来どおり）。上の表を参照 */
  placement?: "above-body" | "in-body";
}) {
  if (placement === "in-body") {
    return (
      <div className="pb-4 sm:pb-6">
        <TabBar>{children}</TabBar>
      </div>
    );
  }
  return (
    <div className="bg-background px-4 pt-6 sm:px-8 sm:pt-8">
      <TabBar>{children}</TabBar>
    </div>
  );
}

/**
 * **同一ページ内で切り替えるタブバー** (下線付きの 1 行)。子は `TabButton` を並べる。
 *
 * ボタンの直接の親に `role="tablist"` を付ける (`role="tab"` の必須親)。
 * `TabButton` はこの中でしか使わないこと。
 */
export function TabList({
  children,
  label,
  variant = "underline",
  size = "md",
  fullWidth = false,
}: {
  children: ReactNode;
  /** タブ群の用途 (`aria-label`)。同じ画面に複数のタブ群がある場合に付ける。 */
  label?: string;
  /** 見た目。既定 `"underline"`（従来どおり・DOM は変わらない）。子の `TabButton` に Context で届く */
  variant?: TabVariant;
  /** `"segmented"` のときだけ効く。既定 `"md"` */
  size?: TabSize;
  /** `"segmented"` のときだけ効く。横幅いっぱいにして項目を等分する */
  fullWidth?: boolean;
}) {
  if (variant === "segmented") {
    return (
      <TabStyleContext.Provider value={{ variant, size, fullWidth }}>
        <div className={segmentedTrackClass(fullWidth)} role="tablist" aria-label={label}>
          {children}
        </div>
      </TabStyleContext.Provider>
    );
  }
  // 既定でも Provider で包む（DOM は出ない）。セグメント型の中に下線型を入れ子にしても、
  // 内側の TabButton が外側の見た目を拾わないようにするため
  return (
    <TabStyleContext.Provider value={UNDERLINE_STYLE}>
      <div className="border-b border-border">
        <div className="flex gap-0" role="tablist" aria-label={label}>
          {children}
        </div>
      </div>
    </TabStyleContext.Provider>
  );
}

/** 同一ページ内で表示を切り替えるタブ。**必ず `TabList` の中で使う**。 */
export function TabButton({
  isActive,
  label,
  onClick,
  count,
  testId,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
  /** 件数を label の後ろに小さく出す (省略時は何も描画しない)。 */
  count?: number;
  testId?: string;
}) {
  const { variant, size, fullWidth } = useContext(TabStyleContext);
  if (variant === "segmented") {
    return (
      <button
        type="button"
        onClick={onClick}
        role="tab"
        aria-selected={isActive}
        aria-current={isActive ? "page" : undefined}
        className={tabItemClass(isActive, "segmented", { size, fullWidth })}
        data-testid={testId}
      >
        <span>{label}</span>
        {count !== undefined && (
          <span
            className={`ml-1.5 text-role-caption ${isActive ? "text-on-accent" : "text-muted"}`}
          >
            {count}
          </span>
        )}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      aria-current={isActive ? "page" : undefined}
      className={tabItemClass(isActive)}
      data-testid={testId}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`ml-1.5 text-xs ${isActive ? "text-muted" : "text-muted/60"}`}
        >
          {count}
        </span>
      )}
      {isActive && <TabUnderline />}
    </button>
  );
}

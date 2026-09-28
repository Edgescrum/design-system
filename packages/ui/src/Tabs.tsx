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
 * `PageTabBar` はページ本文と同じ横 padding (`px-4 sm:px-8`) を内包するので、
 * 最左タブの左端が見出し・カードの左端と揃う (#540 round 6 の調整をそのまま踏襲)。
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
 * ## ベースライン
 *
 * peco 側の `existing-plan-nav-dom.baseline.json` が店舗設定タブ / プレビュー画面の
 * innerHTML を **バイト単位** で固定している (#853 / #861)。
 * ここの DOM を変えるときは、**どのキーがなぜ変わるのかを PR 本文に書いたうえで**
 * ベースラインを更新すること (無言の更新はこの回帰テストを無力化する)。
 */

import type { ReactNode } from "react";

/** タブ 1 つ分の共通クラス (状態に依らない部分)。 */
export const TAB_ITEM_BASE_CLASS =
  "relative flex flex-1 items-center justify-center whitespace-nowrap py-2.5 text-center text-xs font-medium transition-colors sm:text-sm";

/** タブ 1 つ分のクラス (アクティブ状態込み)。 */
export function tabItemClass(isActive: boolean): string {
  return `${TAB_ITEM_BASE_CLASS} ${
    isActive ? "text-foreground" : "text-muted hover:text-foreground"
  }`;
}

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
export function TabBar({ children }: { children: ReactNode }) {
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
 * ページ最上部に置くリンクのタブバー。本文と同じ横 padding を内包する。
 */
export function PageTabBar({ children }: { children: ReactNode }) {
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
}: {
  children: ReactNode;
  /** タブ群の用途 (`aria-label`)。同じ画面に複数のタブ群がある場合に付ける。 */
  label?: string;
}) {
  return (
    <div className="border-b border-border">
      <div className="flex gap-0" role="tablist" aria-label={label}>
        {children}
      </div>
    </div>
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

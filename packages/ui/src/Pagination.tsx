"use client";

/**
 * 共通ページネーション UI
 *
 * 元々 `/provider/billing` の支払い履歴で実装されていた UI を切り出して
 * `/provider/refer` の紹介履歴と共有できるようにしたコンポーネント。
 *
 * 表示要素:
 *   - 件数サマリー (例: 「123件中 1〜10件を表示」)。SP では「1〜10 / 123件」と短縮表示
 *   - 「前へ / 次へ」ボタン + 「現在ページ / 総ページ数」インジケータ
 *
 * 1 ページあたりの件数 (`pageSize`) は呼び出し側で決める。
 * billing と refer で揃えるためデフォルト値は `10` としているが、
 * 引数で上書き可能。
 */

import { useEffect } from "react";

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export interface PaginationRange {
  /** 現在ページ (1-indexed) */
  currentPage: number;
  /** 総ページ数 (常に >= 1) */
  totalPages: number;
  /** 現在ページの先頭インデックス (0-indexed) */
  pageStart: number;
  /** 現在ページの末尾インデックス +1 (0-indexed, slice 用) */
  pageEnd: number;
}

/**
 * total 件数と pageSize から、現在ページの範囲を計算する pure 関数。
 * UI から切り離してテスト可能にしている。
 *
 *   - totalPages は最低 1 (空配列でも 1 ページ目を返す)
 *   - currentPage が範囲外なら clamp する (1 〜 totalPages の間)
 */
export function getPaginationRange(
  total: number,
  pageSize: number,
  currentPage: number
): PaginationRange {
  const safeTotal = Math.max(0, Math.floor(total));
  const safeSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeSize));
  const clamped = Math.min(Math.max(1, Math.floor(currentPage)), totalPages);
  const pageStart = (clamped - 1) * safeSize;
  const pageEnd = pageStart + safeSize;
  return { currentPage: clamped, totalPages, pageStart, pageEnd };
}

export interface PaginationProps {
  /** 全件数 */
  totalItems: number;
  /** 1 ページあたりの件数 */
  pageSize: number;
  /** 現在ページ (1-indexed) */
  currentPage: number;
  /** ページ変更コールバック */
  onPageChange: (page: number) => void;
  /**
   * 件数サマリーを表示するかどうか。デフォルト true。
   * (リスト上部で別途件数表示している場合などに false にできる)
   */
  showSummary?: boolean;
  /**
   * 上部の border / padding を出すかどうか。デフォルト true。
   * billing の table 直後配置で使う見た目を踏襲。
   */
  withTopBorder?: boolean;
}

/**
 * 共通ページネーション UI コンポーネント。
 *
 * - `totalPages <= 1` の場合は何も描画しない (画面のチラつき防止)
 * - currentPage がリスト件数変更などで out-of-range になった場合は
 *   自動で 1 ページ目に戻す (useEffect)
 */
export function Pagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  showSummary = true,
  withTopBorder = true,
}: PaginationProps) {
  const { totalPages, pageStart, pageEnd } = getPaginationRange(
    totalItems,
    pageSize,
    currentPage
  );

  // Defensive: clamp page if totalItems shrinks (e.g., after refetch)
  useEffect(() => {
    if (currentPage > totalPages) {
      onPageChange(1);
    }
  }, [totalPages, currentPage, onPageChange]);

  if (totalPages <= 1) return null;

  const displayEnd = Math.min(pageEnd, totalItems);

  return (
    <div
      className={
        "mt-5 flex items-center justify-between gap-4 " +
        (withTopBorder ? "border-t border-border/60 pt-4" : "")
      }
    >
      {showSummary ? (
        <span className="text-xs text-muted">
          <span className="hidden sm:inline">
            <span className="font-bold text-foreground">{totalItems}件中</span>{" "}
            <span className="tabular-nums">
              {pageStart + 1}〜{displayEnd}
            </span>
            件を表示
          </span>
          <span className="sm:hidden">
            <span className="tabular-nums">
              {pageStart + 1}〜{displayEnd}
            </span>{" "}
            / {totalItems}件
          </span>
        </span>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="前のページ"
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent-bg hover:text-accent-dark disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-foreground"
        >
          <ChevronLeftIcon />
        </button>
        <span className="px-3 text-[12.5px] font-semibold tabular-nums">
          {currentPage}
          <span className="ml-1.5 font-medium text-muted">/ {totalPages}</span>
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="次のページ"
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent-bg hover:text-accent-dark disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-foreground"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}

/** 紹介履歴 / 支払い履歴で揃える 1 ページあたりの件数。 */
export const DEFAULT_PAGE_SIZE = 10;

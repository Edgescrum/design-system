/**
 * 5 段評価のバッジ（アンケートのドライバー評価）— DS#24 の b2。
 *
 * ## なぜ部品にしたか
 *
 * peco の `review-management-client.tsx` と `customers/[id]/customer-detail-client.tsx` に
 * **バイト単位で同一**の実装が `DriverBadge` / `SurveyDriverBadge` という別名で入っていた
 * （色マップ 5 行・フォールバック・マークアップまで同じ）。色をトークン化するだけだと
 * 2 箇所を同じように直すことになるので、寄せ先をここに作る。
 *
 * ## なぜ positive / warning / danger に潰さないのか
 *
 * あちらは「良い・注意・危険」の **3 状態**、こちらは 1〜5 の **連続スケール**。
 * 3 色に潰すと隣り合う段（2 と 3、4 と 5）の見分けがつかなくなる。
 * そのため橙（2 段目）と黄（3 段目）を**スケール専用に**パレットへ入れてある
 * （2026-10-06 裁定）。**この 2 色をスケール以外の用途に流用しないこと。**
 *
 * ## ★ クラス名を組み立てないこと
 *
 * `bg-rating-${value}-bg` のように**動的に作ったクラスは Tailwind が拾えない**
 * （スキャンは文字列の literal しか見ない）。下の表はそのために静的に書いてある。
 * 段を足すときも表に行を足すこと。
 *
 * ## 色の出どころ
 *
 * `@edgescrum/ds-foundation` の `rating/*`。1〜3 と範囲外は peco の旧実装と同値
 * （= 画素差分なし）、**4・5 は emerald → green の統一で色が変わる**（同裁定の A）。
 */

/** 1〜5 と範囲外（`unknown`）の配色。★ 動的生成しないこと（上記）。 */
const RATING_CLASS = {
  1: "bg-rating-1-bg text-rating-1-fg border-rating-1-border",
  2: "bg-rating-2-bg text-rating-2-fg border-rating-2-border",
  3: "bg-rating-3-bg text-rating-3-fg border-rating-3-border",
  4: "bg-rating-4-bg text-rating-4-fg border-rating-4-border",
  5: "bg-rating-5-bg text-rating-5-fg border-rating-5-border",
} as const;

const RATING_CLASS_UNKNOWN =
  "bg-rating-unknown-bg text-rating-unknown-fg border-rating-unknown-border";

/**
 * 評価値に対応する配色クラスを返す。1〜5 の整数以外はすべて `unknown` の配色。
 *
 * バッジ以外の見た目（グラフの帯など）で同じスケールを使うとき用に export してある。
 */
export function ratingToneClass(value: number): string {
  return RATING_CLASS[value as keyof typeof RATING_CLASS] ?? RATING_CLASS_UNKNOWN;
}

export interface RatingBadgeProps {
  /** 評価の項目名（「接客」「清潔さ」など）。 */
  label: string;
  /** 1〜5 の評価値。範囲外は無彩色で描く（データ不整合を黙って良い色にしない）。 */
  value: number;
}

export function RatingBadge({ label, value }: RatingBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${ratingToneClass(value)}`}
    >
      {label}
      <span className="font-bold">{value}</span>
    </span>
  );
}

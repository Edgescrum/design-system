import type { ReactNode } from "react";
import { cx } from "./cx";
import { pickDataAttributes, type DataAttributes } from "./PageBody";

export type CenteredNoticeProps = {
  /** 状態の見出し（`<h1>`）。例:「お支払い手続きが完了しました」 */
  title: ReactNode;
  /** 本文。`<p>` で描く */
  description?: ReactNode;
  /** 本文の `<p>` に付ける `data-testid`（文言を検査するテストが要る画面向け） */
  descriptionTestId?: string;
  /** 補足（小さい文字）。例:「このページは閉じて構いません。」・エラーコード */
  note?: ReactNode;
  /** 見出しの上のアイコン。寸法・色込みの完成形を渡す */
  icon?: ReactNode;
  /** カード最上部のブランドマーク。寸法込みの完成形を渡す（ADR 0026: ロゴは product 層が持つ） */
  logo?: ReactNode;
  /** 操作（「トップに戻る」など）。縦に並べる。`buttonClass()` を付けたリンクを渡す */
  actions?: ReactNode;
  /**
   * `<main>` に足すクラス。**最小の高さ専用**（例: peco の `min-h-app` / `min-h-[60vh]`）。
   *
   * ★ DS が高さを決めないのは、**画面の高さの定義がプロダクト固有**だから。peco の `min-h-app` は
   *   `calc(var(--app-viewport, 100svh) - var(--env-banner-h, 0px))` で、LIFF の viewport 補正と
   *   staging のデモ環境バナーの高さを引いている。どちらも peco の CSS 変数（ADR 0027 で
   *   「peco の CSS 変数のまま」と裁定したもの）なので、DS が `min-h-app` を書くと
   *   **定義していないプロダクトでは黙って何も起きない**クラスになる。
   *   余白の上書きには使わないこと。
   */
  className?: string;
} & DataAttributes;

/**
 * 行き止まりの状態表示（ADR 0027 Decision 2 の CenteredNotice）。
 * 決済・Stripe からの戻り / 認証エラー / 非公開店舗 / 404・エラーのように、
 * **操作が「戻る」「閉じる」程度で作業が無い画面**に使う（§9-11 の決定表の 1 番目）。
 *
 * **自分で `<main>` を描く**（`PageBody` は通さない）。ナビも AppBar も無い、
 * 画面の中央にカードが 1 枚だけある形で、本文の余白の規則（`space.page.*` の上下）とは
 * 縦の構図が違うため。左右余白だけは本文と同じ `space.page.inline` を使う。
 *
 * ## 形
 *
 * peco の `stripe-connect/return` と `invoice-payment/return` の 2 画面（完全に同じマークアップ）を
 * 基準にし、`auth/claim/error` のロゴ・アイコン・操作と、`p/[slug]` の非公開表示のアイコン・
 * 操作を**スロット**として足した。4 画面の差（上下余白 py-10 / 12 / 16、カードの有無・幅）は
 * この部品に寄せた時点で揃う —— 揃えるのが目的（ADR 0027 の実測 1・2）。
 */
export function CenteredNotice({
  title,
  description,
  descriptionTestId,
  note,
  icon,
  logo,
  actions,
  className,
  ...rest
}: CenteredNoticeProps) {
  return (
    <main
      {...pickDataAttributes(rest)}
      className={cx(
        "flex items-center justify-center bg-background px-page-inline py-16",
        className
      )}
    >
      <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center ring-1 ring-border">
        {logo ? <div className="mb-6 flex justify-center">{logo}</div> : null}
        {icon ? <div className="mb-4 flex justify-center">{icon}</div> : null}
        <h1 className="text-lg font-bold">{title}</h1>
        {description ? (
          <p className="mt-4 text-sm leading-relaxed text-muted" data-testid={descriptionTestId}>
            {description}
          </p>
        ) : null}
        {note ? <p className="mt-4 text-xs text-muted">{note}</p> : null}
        {actions ? <div className="mt-6 flex flex-col gap-2">{actions}</div> : null}
      </div>
    </main>
  );
}

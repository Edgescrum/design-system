import { cx } from "./cx";
import { ChevronRightIcon } from "./icons";

/** 押せる行で使うリンクの部品（`next/link` の `Link` など）。`href` / `className` / 中身を受け取れること */
export type AlertLinkComponent = React.ComponentType<{
  href: string;
  className?: string;
  children?: React.ReactNode;
}>;

type AlertBaseProps = {
  type: "error" | "success" | "warning";
  /**
   * ADR-0011: Server Action の結果だけが描画する目印。
   * エラー文言の e2e は「同じ画面の静的コピーにも一致する正規表現」ではなく
   * この testid を見ること（#833 が長期間見逃された原因そのもの）。
   * 省略時は属性を 1 つも出さない（既存の DOM ベースラインを動かさないため）。
   */
  "data-testid"?: string;
};

export type AlertProps = AlertBaseProps &
  (
    | {
        children: React.ReactNode;
        href?: undefined;
        linkComponent?: undefined;
        onClick?: undefined;
      }
    | {
        /** 押せる行: 行全体が 1 つのリンクになる（右端に ›）。中身は文字列だけ */
        children: string;
        href: string;
        /** リンクの部品（`next/link` の `Link` など）。既定は `<a>` */
        linkComponent?: AlertLinkComponent;
        onClick?: undefined;
      }
    | {
        /** 押せる行: 行全体が 1 つのボタンになる（右端に ›）。中身は文字列だけ */
        children: string;
        onClick: () => void;
        href?: undefined;
        linkComponent?: undefined;
      }
  );

const TONE = {
  error: "bg-red-50 text-red-600",
  success: "bg-green-50 text-green-600",
  // UAT round 9: 強制削除モード等の警告表示用 (削除確認モーダル).
  // 2026-10-04 裁定: orange はパレット外だったため warning トークン（amber）に統一。
  warning: "bg-warning-bg text-warning",
} as const;

/**
 * 押せる行の中身（リンク / ボタン）。余白は従来の箱と同じ（`px-4 py-3`）なので、
 * 押せない Alert と並べても文字の位置は揃う。
 */
const ROW_CLASS = cx(
  "group flex w-full items-center gap-related rounded-xl px-4 py-3 text-left",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
);

/**
 * 送信結果・注意書きを 1 行で出す共有ボックス。**アプリ内の 38 ファイルが使う。**
 *
 * ## `role` を部品側に持たせている理由（#1165）
 *
 * dev HEAD（2026-09-05 / `7165c514`）まで、この部品は `role` も `aria-live` も
 * 持っていなかった。**区別は色だけ**で、実ブラウザで計測すると次のようになる:
 *
 *   Chromium の computed AX node（`Accessibility.getPartialAXTree`）
 *     修正前: {"role":"generic","name":"","ignored":false}
 *     ariaSnapshot: `- text: 登録に失敗しました`
 *
 * つまり支援技術には**ただのテキスト**としてしか届かない。さらに大半の `Alert` は
 * **submit の後に動的に出現する**（`setError(...)` → 再描画）ので、live region が
 * 無い以上、フォーカスが移らない限り**読み上げは一度も発生しない**。
 * 目が見えない利用者にとっては「送信ボタンを押したのに何も起きなかった」になる。
 *
 * - `error`   → `role="alert"`（暗黙に `aria-live="assertive"`）。割り込んで読む
 * - `success` / `warning` → `role="status"`（暗黙に `aria-live="polite"`）。
 *   読んでいる途中の内容を中断しない
 *
 * **`aria-live` を併記しないこと。** `alert` / `status` は暗黙値を持つので、
 * 書くと同じことを 2 通りに管理することになる（片方だけ直す事故が起きる）。
 *
 * ## 呼び出し側で `role="alert"` を巻かないこと
 *
 * `<div role="alert"><Alert type="error">…</Alert></div>` にすると live region が
 * 入れ子になり、実装によっては**同じ文言が 2 回読み上げられる**。
 * #1165 の修正時に唯一そうなっていた `provider/[slug]/profile/shift/page.tsx` は
 * ラッパーを外して `<Alert data-testid=…>` に寄せてある。
 *
 * 自前のマークアップ（`<p role="alert" className="text-xs text-red-600">` など）に
 * `role` を書くのは従来どおり問題ない。**`<Alert>` を巻くときだけ**の話。
 *
 * ## 静的に描画される `Alert` について
 *
 * live region は「変化」を読むので、SSR 済みで最初から出ているものは
 * `role` を付けても読み上げは発生しない。そこでは `role="alert"` /
 * `role="status"` は**静的な意味づけ**（これは警告である／状態表示である）として効く。
 *
 * ## 押せる行（`href` / `onClick`・#56）
 *
 * 一覧の上のお知らせ（「重複の可能性があるお客さまが 3 組います」）から対応する画面へ進ませる形。
 * **行全体が 1 つのリンク / ボタン**になり、右端に › が出る。
 *
 * ```html
 * <div role="status" class="… 色 …">          ← live region（#1165 のまま。外側に 1 つだけ）
 *   <a href="…" class="… 余白・› …">            ← 行全体（名前 = 本文。› は aria-hidden）
 *     <span>重複の可能性があるお客さまが 3 組います</span><svg aria-hidden="true">›</svg>
 *   </a>
 * </div>
 * ```
 *
 * - **`role` をリンク / ボタンに付けない。** `<a role="status">` にするとリンクであることが
 *   読み上げから消える。live region は外側の箱のまま、中にリンクを 1 つ置く
 *   （status / alert は中に操作できる要素を持ってよい。「中身が子として扱われない」role ではない）
 * - 名前は本文そのもの（› は `aria-hidden`）。動的に出たときは status が本文を 1 回読み、
 *   フォーカスしたときはリンク / ボタンとして本文が読まれる
 * - **中身は文字列だけ**（`children: string`）。リンクの中にリンク・ボタンを入れる
 *   （= 入れ子の操作。HTML として不正）ことを型で止める（InfoTip と同じ考え方）
 * - peco の画面遷移は `next/link` が要る（LIFF で全体を読み込み直さない）。DS は next に依存しないので
 *   `linkComponent={Link}` で受け取る（既定は `<a>`）
 * - `href` / `onClick` を渡さない Alert の DOM は**従来と 1 バイトも変わらない**（verify:alert が固定）
 */
export function Alert(props: AlertProps) {
  const { type, children, "data-testid": testId } = props;
  const role = type === "error" ? "alert" : "status";
  const testIdAttr = testId ? { "data-testid": testId } : {};

  if (props.href === undefined && props.onClick === undefined) {
    return (
      <div role={role} className={`rounded-xl px-4 py-3 text-sm ${TONE[type]}`} {...testIdAttr}>
        {children}
      </div>
    );
  }

  const content = (
    <>
      {/* 押せることは › と hover の下線で示す（色は変えない = 種類の色を保つ） */}
      <span className="min-w-0 flex-1 group-hover:underline">{children}</span>
      <ChevronRightIcon width={16} height={16} aria-hidden="true" className="shrink-0" />
    </>
  );

  let row: React.ReactNode;
  if (props.href !== undefined) {
    const Link = props.linkComponent ?? "a";
    row = (
      <Link href={props.href} className={ROW_CLASS}>
        {content}
      </Link>
    );
  } else {
    row = (
      <button type="button" onClick={props.onClick} className={ROW_CLASS}>
        {content}
      </button>
    );
  }

  // live region（role）は外側の箱だけ。余白は中のリンク / ボタンが持つ（行全体を押せるように）
  return (
    <div role={role} className={`rounded-xl text-sm ${TONE[type]}`} {...testIdAttr}>
      {row}
    </div>
  );
}

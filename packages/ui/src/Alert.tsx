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
 */
export function Alert({
  type,
  children,
  "data-testid": testId,
}: {
  type: "error" | "success" | "warning";
  children: React.ReactNode;
  /**
   * ADR-0011: Server Action の結果だけが描画する目印。
   * エラー文言の e2e は「同じ画面の静的コピーにも一致する正規表現」ではなく
   * この testid を見ること（#833 が長期間見逃された原因そのもの）。
   * 省略時は属性を 1 つも出さない（既存の DOM ベースラインを動かさないため）。
   */
  "data-testid"?: string;
}) {
  const styles = {
    error: "bg-red-50 text-red-600",
    success: "bg-green-50 text-green-600",
    // UAT round 9: 強制削除モード等の警告表示用 (削除確認モーダル).
    warning: "bg-orange-50 text-orange-700",
  }[type];

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 text-sm ${styles}`}
      {...(testId ? { "data-testid": testId } : {})}
    >
      {children}
    </div>
  );
}

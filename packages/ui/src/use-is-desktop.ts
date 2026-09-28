"use client";

/**
 * #911 / #927: 「デスクトップ幅かどうか」を **render 中に同期で** 判定する共通フック。
 *
 * ## なぜ `useState` + `useEffect` ではだめか
 *
 * ```ts
 * const [isDesktop, setIsDesktop] = useState(false);   // 初期値 false
 * useEffect(() => { setIsDesktop(mq.matches); }, []);  // 描画の *後* に走る
 * ```
 *
 * `useEffect` (passive effect) はブラウザが描画したあとに走るため、
 * コンポーネントが mount された最初のフレームは必ず `false` = モバイル用の
 * 中央シートとして **commit されてしまう**。デスクトップでは
 *
 *   1 フレーム目 = 画面中央のシート → effect で true → クリック位置のポップオーバー
 *
 * という「中央に一瞬出てから移動する」ブリンクになる。
 *
 * ## 却下した代替案 (PR #919 / #911 で実測済み)
 *
 * - `useLayoutEffect` … 見えるフラッシュは消えるが **誤った DOM フレームは commit される**
 *   (テストからも観測できてしまう = 直っていない)
 * - `ready` フラグで初回描画を止める … 空のフレームが 1 つ増えるだけで本質は同じ
 * - CSS メディアクエリで両方描画して片方を隠す … `role="dialog"` や form の id が
 *   重複し、`aria-label` も共通なので既存 e2e が strict mode violation で落ちる
 *
 * ## `useSyncExternalStore` を採る理由
 *
 * - mount し直されても **最初の render から正しい見た目** (誤ったフレームを 1 つも commit しない)
 * - 購読開始と snapshot 読み取りのズレを React が面倒みる
 *   (自前の `useState` + `useEffect` は「render と subscribe の間の変化」を取りこぼす)
 * - SSR 用の snapshot を別に渡せる
 *
 * ## 注意 (SSR / ハイドレーション)
 *
 * サーバー snapshot は常に `false` (= 中央シートにフォールバック) を返す。
 * このフックを使う要素がサーバー描画結果に含まれる場合は、
 * ハイドレーション不一致にならないか呼び出し側で確認すること。
 * 既存の呼び出し元 (`empty-slot-sheet.tsx`) は「開いたときだけ描画する」ため
 * サーバー描画結果には含まれない。
 */

import { useSyncExternalStore } from "react";

/** sm ブレークポイント (Tailwind の `sm:` と同じ 640px)。 */
export const DESKTOP_MEDIA_QUERY = "(min-width: 640px)";

function desktopMediaQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  return window.matchMedia(DESKTOP_MEDIA_QUERY);
}

/** `useSyncExternalStore` の subscribe: ビューポート変化 (回転 / リサイズ) を購読する。 */
function subscribeDesktop(onStoreChange: () => void): () => void {
  const mq = desktopMediaQuery();
  if (!mq) return () => {};
  mq.addEventListener?.("change", onStoreChange);
  return () => mq.removeEventListener?.("change", onStoreChange);
}

/** `useSyncExternalStore` の snapshot: render 中に **同期で** 現在の幅を読む。 */
function getDesktopSnapshot(): boolean {
  return desktopMediaQuery()?.matches ?? false;
}

/**
 * サーバー用 snapshot。`matchMedia` が無い環境 (SSR) では従来どおり
 * false = 中央シートにフォールバックする。
 */
function getDesktopServerSnapshot(): boolean {
  return false;
}

/** デスクトップ幅 (>=640px) かどうかを render 中に同期で返す。 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  );
}

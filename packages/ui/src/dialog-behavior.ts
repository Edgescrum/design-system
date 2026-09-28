"use client";

/**
 * #2212: `role="dialog"` を名乗る要素が満たすべき**振る舞い**を 1 箇所に置く。
 *
 * ## なぜこのモジュールがあるか
 *
 * #1994 で `Modal` は全 27 箇所に `role="dialog"` + `aria-modal="true"` を付けた。
 * ところが `Modal` は**ダイアログが満たすべき残り 3 つを 1 つも実装していなかった**
 * （#2212）:
 *
 *   1. Escape で閉じない（`keydown` の購読が 1 つも無かった）
 *   2. フォーカストラップが無い（Tab が背後のページを巡回していた）
 *   3. 閉じてもフォーカスが呼び出し元に戻らない（`<body>` に落ちていた）
 *
 * `aria-modal="true"` は支援技術に「背後は無いもの扱いにせよ」と伝えるので、
 * 2 が無いと**キーボードの実挙動と読み上げの申告がずれる**。
 *
 * ## 写経しないための置き場所
 *
 * まったく同じ処理が `MobilePreviewSticky.tsx` の `useDialogFocusManagement`
 * として**既に存在していた**（#1382 系の実装）。`Modal` 側にもう 1 本書くと
 * 同じロジックを 2 箇所で管理することになり、#1994 が潰した
 * 「1 件ずつ足す運用」に戻る。**両方をこのフックに寄せた。**
 *
 * ## ★ 参加していないダイアログがある（#1998）
 *
 * `Modal` を使わない**手書き portal** は、いまも自前の `keydown` を持つ:
 *
 *   - `schedule/block-detail-popover.tsx` … `window` に直接 Escape
 *   - `schedule/empty-slot-sheet.tsx` の PC 用ポップオーバー … 同上
 *   - `schedule/customer-picker-sheet.tsx` … Escape そのものが無い
 *
 * **これらは下の「重なり順」スタックに載っていない。** したがって
 * 手書き portal が `Modal` の上に重なった場合、Escape は
 * **両方に届く**（最前面だけ、が成立しない）。2026-09-17 時点で
 * そう重なる画面は無いことを確認したうえで、#1998（手書き portal を
 * `Modal` に寄せる）で解消する前提にしている。
 * **手書き portal を足すなら、このフックを使うこと。**
 */

import { useEffect, useRef } from "react";

/**
 * 開いているダイアログの**重なり順**（末尾が最前面）。
 *
 * Escape を「最前面のダイアログだけ」が処理するために要る。
 * `document` に付けた listener は開いている全ダイアログ分が発火するので、
 * これが無いと**入れ子のモーダルで Escape 1 回が全部閉じる。**
 *
 * module スコープなのでタブ内で 1 本。`Modal` と `MobilePreviewSticky` が
 * 同じ配列を共有する（両方が `document` に listener を付けるため、
 * 別々のスタックを持つと「互いに最前面」になってしまう）。
 */
const dialogStack: symbol[] = [];

/** テスト用。スタックが漏れていないこと（= cleanup が走ったこと）を見る。 */
export function __openDialogCountForTest(): number {
  return dialogStack.length;
}

/**
 * 要素配下のフォーカス可能要素を取得する。
 * disabled / tabindex=-1 / hidden な要素は除外する。
 *
 * （`MobilePreviewSticky.tsx` の `getFocusable` をそのまま移設したもの。
 * セレクタを変えるときは両方のダイアログに効くことを意識すること。）
 */
export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((el) => {
    // hidden や display:none は除外
    if (el.hasAttribute("hidden")) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return true;
  });
}

export interface UseDialogBehaviorOptions {
  /** 開いているか。false のあいだは listener を張らない */
  open: boolean;
  /** ダイアログ本体（トラップの範囲 = この要素の内側） */
  containerRef: React.RefObject<HTMLElement | null>;
  /**
   * Escape で呼ぶ関数。**「閉じる」ではなく「取り消す」を渡すこと。**
   *
   * 破壊的操作の確認ダイアログでは、Escape は**キャンセル扱い**でなければ
   * ならない（#2212 の受け入れ基準）。このフックは `onClose` を呼ぶだけなので、
   * 呼び出し側が「実行」を渡さない限り自動的にそうなる。
   *
   * 送信中に閉じさせたくない呼び出し（billing の 3 本 /
   * `reschedule-confirm-modal`）は `onClose={submitting ? () => {} : onClose}` を
   * 渡しており、**Escape もその no-op を呼ぶ**ので送信中は閉じない。
   *
   * 毎 render で identity が変わってよい（ref 経由で読むので effect は
   * 張り直されない）。**ここを deps に入れてはいけない** — 張り直すたびに
   * 「開く前のフォーカス」を取り直してしまい、復元先がダイアログ自身になる。
   */
  onClose: () => void;
  /**
   * false ならこのフックは何もしない（listener も張らず、フォーカスも奪わない）。
   * `Modal` の `role="presentation"` opt-out 用（#1994）。
   */
  enabled?: boolean;
  /**
   * open 時のフォーカス先。
   *
   *   - `"container"` … コンテナ自身（`tabIndex={-1}`）。`Modal` の既定（#1994）。
   *     確認ダイアログで「削除する」に最初からフォーカスが載るのを避けられる
   *   - `"first-focusable"` … 最初のフォーカス可能要素。`MobilePreviewSticky` の既定
   */
  initialFocus?: "container" | "first-focusable";
  /**
   * 初期フォーカスを microtask まで遅らせる。
   *
   * `MobilePreviewSticky` の既存挙動。「React の portal mount 直後は
   * 要素が DOM にあってもフォーカス移動が競合することがある」ため。
   * `Modal` は #1994 から同期で移しており、その挙動を変えない（既存 unit
   * テストが `render()` 直後に `document.activeElement` を見る）。
   */
  deferInitialFocus?: boolean;
}

/**
 * ダイアログの Escape / フォーカストラップ / フォーカス復元をまとめて有効にする。
 *
 * **`document` の bubble phase**に listener を張る。capture ではない理由:
 * モーダルの中には Escape を自前で使う部品（`SelectDropdown` /
 * `CategorySelector`）が居り、そちらが**先に**処理できないと
 * 「ドロップダウンを閉じるつもりが、モーダルごと閉じる」になる。
 * それらは処理時に `preventDefault()` を呼ぶので、ここでは
 * `defaultPrevented` を見て降りる。
 */
export function useDialogBehavior({
  open,
  containerRef,
  onClose,
  enabled = true,
  initialFocus = "container",
  deferInitialFocus = false,
}: UseDialogBehaviorOptions) {
  const onCloseRef = useRef(onClose);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // `onClose` は毎 render で identity が変わる（呼び出し側の大半がインラインの
  // アロー関数）。deps に入れず ref 経由で読む。**この effect を下の effect より
  // 先に宣言すること**（React は宣言順に effect を走らせる）。
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open || !enabled) return;
    if (typeof document === "undefined") return;

    // open 直前のフォーカス要素（= 呼び出し元のボタン）を覚えておく
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    const id = Symbol("dialog");
    dialogStack.push(id);

    const moveInitialFocus = () => {
      if (initialFocus === "container") {
        container.focus();
        return;
      }
      const items = getFocusableElements(container);
      const target = items[0] ?? container;
      try {
        target.focus({ preventScroll: true });
      } catch {
        // noop
      }
    };
    if (deferInitialFocus) queueMicrotask(moveInitialFocus);
    else moveInitialFocus();

    const onKeyDown = (e: KeyboardEvent) => {
      // 最前面のダイアログだけが処理する（入れ子で 1 回の Escape が全部
      // 閉じるのを防ぐ）
      if (dialogStack[dialogStack.length - 1] !== id) return;
      // 内側の部品（SelectDropdown 等）が既に処理済みなら降りる
      if (e.defaultPrevented) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const items = getFocusableElements(container);
      if (items.length === 0) {
        // フォーカス可能要素が無ければコンテナ自身に留める
        e.preventDefault();
        container.focus();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        // ★ `active === container` を忘れないこと。
        //   `Modal` は open 時にコンテナ自身（`tabIndex={-1}`）へフォーカスを移す
        //   （#1994）ので、**開いた直後の Shift+Tab がこの経路に来る。**
        //   コンテナは中身より前に居るため、既定動作だと
        //   「ダイアログの外（＝ 1 つ前の要素）」へ出て行く。
        //   実測: この分岐が無いと、開いた直後の Shift+Tab 1 回で
        //   Next.js の dev オーバーレイ（`<nextjs-portal>`）にフォーカスが移った。
        if (active === first || active === container || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const at = dialogStack.lastIndexOf(id);
      if (at !== -1) dialogStack.splice(at, 1);
      restoreFocus(previousFocusRef.current);
      previousFocusRef.current = null;
    };
  }, [open, enabled, containerRef, initialFocus, deferInitialFocus]);
}

/**
 * 閉じたときのフォーカスの行き先。
 *
 * 第一候補は**開く前にフォーカスしていた要素**（= 呼び出し元のボタン）。
 * ただしそれが**もう DOM に居ないことがある**:
 *
 *   - 一覧から 1 行を消すダイアログ（消した行のボタンが一緒に消える）
 *   - 削除後に別ページへ遷移するダイアログ
 *   - `LoginRequired` のように、そもそも呼び出し元のボタンが存在しない
 *
 * その場合は **`<body>` に落とす**（= 現在のフォーカスを外す）。
 * ダイアログを開いているあいだにフォーカスが背後へ逃げていると、
 * 「閉じた瞬間に、押してもいない背後のボタンにフォーカスが載っている」
 * という追いにくい状態になる。**復元できないなら、はっきり先頭に戻す。**
 *
 * ## 判定は「focus() が効いたか」で行う（`isConnected` を見ない）
 *
 * 最初の実装は `previous.isConnected` を先に見ていたが、
 * **その分岐は観測できない**（切り離された要素への `focus()` は無反応なので、
 * 見ても見なくても下のフォールバックに落ちる）。実測でも、
 * `isConnected` を外すミューテーションで**どのテストも落ちなかった。**
 * 意味の無い分岐は「守られているつもり」を増やすだけなので消し、
 * **実際に効いたか**（`document.activeElement === previous`）だけを見る。
 */
function restoreFocus(previous: HTMLElement | null) {
  if (previous && typeof previous.focus === "function") {
    try {
      previous.focus({ preventScroll: true });
    } catch {
      // noop
    }
    if (document.activeElement === previous) return;
  }
  // フォールバック: 呼び出し元が消えている / フォーカスを受け付けない
  const active = document.activeElement as HTMLElement | null;
  if (active && active !== document.body && typeof active.blur === "function") {
    active.blur();
  }
}

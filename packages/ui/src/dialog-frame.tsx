"use client";

/**
 * 画面の上に重ねるダイアログの**枠**（暗転面 + 面 + portal）。`Modal` と `BottomSheet` が共有する（#56）。
 *
 * ## なぜ枠を 1 つにしたか
 *
 * `BottomSheet` は `Modal` と**同じ振る舞い**を持たなければならない:
 * `role="dialog"` と名前（型で必須）・開いたら面へフォーカス・Escape・背景タップ・
 * Tab の折り返し・閉じたら呼び出し元へ戻す。振る舞いは `dialog-behavior.ts` に寄せてあるが、
 * **それを呼ぶ枠（暗転面の onClick・面の stopPropagation・aria 属性・portal）まで
 * 2 本書くと、#1994 が潰した「1 件ずつ足す運用」に戻る**（片方にだけ属性を足す・片方だけ
 * 背景タップを忘れる）。枠をここに 1 つだけ置き、見た目（クラス）だけを呼び出し側が渡す。
 *
 * ★ **`Modal` の DOM は 1 バイトも変えていない。** `Modal` は従来と同じクラス列と属性を
 *   この枠に渡すだけ（`packages/ui/verify.mjs` の verify:modal と `test/Modal.test.tsx` が固定）。
 *   `data-state` は渡されたときだけ出す（`Modal` は渡さない）。
 *
 * ## 送信中は閉じない
 *
 * 枠は `onClose` を Escape と背景タップで呼ぶだけで、自分では閉じない（`open` は呼び出し側が持つ）。
 * 送信中に閉じさせたくない呼び出しは `onClose={submitting ? () => {} : onClose}` を渡す
 * （peco の billing の 3 本 / `reschedule-confirm-modal` と同じ。`Modal` と同じ約束）。
 */

import { useRef } from "react";
import { createPortal } from "react-dom";

import { useDialogBehavior } from "./dialog-behavior";

/**
 * #1994: **ダイアログであることが既定。opt-in から opt-out へ反転した。**
 *
 * ## なぜ反転したか
 *
 * #685 は「既存の呼び出しは挙動不変」を優先して `role="dialog"` を opt-in にした。
 * その結果 **#685 から #1994 までに 17 ファイルが渡し忘れ**、
 * メニューの削除・予約のキャンセル・プランのダウングレードといった
 * 「元に戻せない操作の確認ダイアログ」が、支援技術には
 * **ただの div** として届いていた（開いたことが通知されず、フォーカスは
 * 背後のページに残り、背後のコンテンツも読み上げ対象から外れない）。
 *
 * **既定が安全側でないと、次に書かれるモーダルがまた漏れる。**
 * 数えた 17 件は「新しく壊れたもの」ではなく「1 件ずつ足す運用が
 * 17 回失敗した結果」なので、1 件ずつ足す運用に戻さない。
 *
 * ## アクセシブルネームは型で必須にしている
 *
 * `role="dialog"` だけ付けて名前が無いダイアログは、支援技術に
 * 「ダイアログ」としか読まれない（どのダイアログか分からない）。
 * ソース走査の lint ではなく**判別可能な union 型**で必須にしているので、
 * `npm run typecheck`（全 Tier 必須）が漏れを止める。
 *
 *   - `ariaLabel` … 文言を直接渡す（大半はこちら）
 *   - `ariaLabelledBy` … ダイアログ内の見出しの `id` を指す
 *
 * ## opt-out（`role="presentation"`）
 *
 * 暗転面に浮くが**ダイアログではない**用途（トースト等）のための逃げ道。
 * 2026-09-13 時点の利用者は 0 件。使うときは
 * `src/components/__tests__/modal-dialog-role-callsites.test.ts` の
 * `ALLOWED_OPT_OUT` に **なぜダイアログではないのかを書いて登録すること**
 * （登録しないと同テストが赤くなる）。
 */
export type DialogA11yProps =
  | {
      role?: "dialog";
      ariaModal?: boolean;
      ariaLabel: string;
      ariaLabelledBy?: undefined;
    }
  | {
      role?: "dialog";
      ariaModal?: boolean;
      ariaLabel?: undefined;
      ariaLabelledBy: string;
    }
  | {
      /** ダイアログではない用途の opt-out。理由コメント必須（#1994）。 */
      role: "presentation";
      ariaModal?: undefined;
      ariaLabel?: string;
      ariaLabelledBy?: undefined;
    };

type DialogFrameProps = DialogA11yProps & {
  /**
   * ダイアログとして振る舞っているか（フォーカス・Escape・Tab の折り返し）。
   * `BottomSheet` が閉じる動きを見せているあいだは false（DOM は残るが、もう操作を受け付けない）。
   */
  open: boolean;
  /** Escape と背景タップで呼ぶ。「閉じる」ではなく「取り消す」を渡すこと（#2212） */
  onClose: () => void;
  /** 暗転面（`fixed inset-0`）のクラス。押すと `onClose` */
  overlayClassName: string;
  /** 面（カード・シート）のクラス */
  panelClassName: string;
  /** 暗転面の要素。`BottomSheet` が閉じる動きの長さを測る・`inert` を付けるのに使う */
  overlayRef?: React.Ref<HTMLDivElement>;
  /** 面の要素。渡さなければ枠の中で持つ */
  panelRef?: React.RefObject<HTMLDivElement | null>;
  /** 開閉の状態（`data-state`）。渡したときだけ属性を出す（`Modal` は渡さない = DOM 不変） */
  dataState?: "open" | "closed";
  children: React.ReactNode;
};

export function DialogFrame({
  open,
  onClose,
  overlayClassName,
  panelClassName,
  overlayRef,
  panelRef,
  dataState,
  role = "dialog",
  ariaModal,
  ariaLabel,
  ariaLabelledBy,
  children,
}: DialogFrameProps) {
  const ownPanelRef = useRef<HTMLDivElement>(null);
  const cardRef = panelRef ?? ownPanelRef;
  const isDialog = role === "dialog";

  /**
   * ダイアログの振る舞い（#685 / #1994 / #2212）。
   *
   *   - open 時に面自身へフォーカスを移す（#1994。`initialFocus="container"`）
   *   - **Escape で閉じる**（#2212 (1)）
   *   - **Tab を面の中で折り返す**（#2212 (2)）
   *   - **閉じたら呼び出し元のボタンへ戻す**（#2212 (3)）
   *
   * `role="presentation"` の opt-out では `enabled: false`。
   * フォーカスを奪わず、Escape も拾わない（#1994 の opt-out の意味を変えない）。
   *
   * ★ 実装は `dialog-behavior.ts` にある。**ここに写経しないこと。**
   */
  useDialogBehavior({
    open,
    containerRef: cardRef,
    onClose,
    enabled: isDialog,
    initialFocus: "container",
  });

  const stateAttr = dataState ? { "data-state": dataState } : {};

  const frame = (
    <div ref={overlayRef} className={overlayClassName} onClick={onClose} {...stateAttr}>
      <div
        ref={cardRef}
        role={role}
        aria-modal={isDialog ? (ariaModal ?? true) : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={isDialog ? -1 : undefined}
        className={panelClassName}
        // 面の中のクリックを暗転面（= 閉じる）へ届かせない。
        // portal の click は React の木を伝って呼び出し元の親（押せる行など）へも届くので、
        // ここで止めると両方を防げる
        onClick={(e) => e.stopPropagation()}
        {...stateAttr}
      >
        {children}
      </div>
    </div>
  );

  if (typeof document === "undefined") return frame;
  return createPortal(frame, document.body);
}

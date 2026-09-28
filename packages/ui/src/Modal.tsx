"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";

import { useDialogBehavior } from "./dialog-behavior";

interface ModalBaseProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  /**
   * モーダルの表示位置。
   * ユーザーFB (2026-08-16): スマホでモーダルが画面下に張り付くのを嫌うため、
   * `"bottom"` も含め全モーダルを常に画面中央に表示する。
   * `"bottom"` は下位互換のために残しているが、`"center"` と同じ中央表示になる。
   * (縦長コンテンツ向けに max-h + スクロールだけは `"bottom"` に付与する)
   */
  position?: "center" | "bottom";
  /** Custom padding for the inner card (default "p-6") */
  padding?: string;
}

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
type ModalA11yProps =
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

export type ModalProps = ModalBaseProps & ModalA11yProps;

export function Modal({
  open,
  onClose,
  children,
  maxWidth = "max-w-sm",
  position = "center",
  padding = "p-6",
  role = "dialog",
  ariaModal,
  ariaLabel,
  ariaLabelledBy,
}: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isDialog = role === "dialog";

  /**
   * ダイアログの振る舞い（#685 / #1994 / #2212）。
   *
   *   - open 時にカード自身へフォーカスを移す（#1994。`initialFocus="container"`）
   *   - **Escape で閉じる**（#2212 (1)）
   *   - **Tab をカードの中で折り返す**（#2212 (2)）
   *   - **閉じたら呼び出し元のボタンへ戻す**（#2212 (3)）
   *
   * `role="presentation"` の opt-out では `enabled: false`。
   * フォーカスを奪わず、Escape も拾わない（#1994 の opt-out の意味を変えない）。
   *
   * ★ 実装は `dialog-behavior.ts` にある。**ここに写経しないこと。**
   *   同じ処理を `MobilePreviewSticky` も使っている。
   */
  useDialogBehavior({
    open,
    containerRef: cardRef,
    onClose,
    enabled: isDialog,
    initialFocus: "container",
  });

  if (!open) return null;

  // ユーザーFB (2026-08-16): スマホでモーダルが下に張り付くのを中央表示に統一。
  //   position="bottom" もモバイルで items-end にせず、常に中央に置く。
  const positionClass = "items-center justify-center";

  // W4-1 (#681): 内容が縦に長いと画面外へはみ出し、ヘッダや保存ボタンに届かなく
  //   なる。position="bottom" のシートには高さ上限 + スクロールを与え、
  //   overscroll-contain で背景へのスクロール伝播 (= タップ誤判定の原因) を防ぐ。
  const overflowClass =
    position === "bottom" ? "max-h-[90vh] overflow-y-auto overscroll-contain" : "";

  const modal = (
    <div
      className={`fixed inset-0 z-50 flex bg-black/40 p-4 ${positionClass}`}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        role={role}
        aria-modal={isDialog ? (ariaModal ?? true) : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={isDialog ? -1 : undefined}
        className={`w-full ${maxWidth} rounded-2xl bg-card ${padding} shadow-xl outline-none ${overflowClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}

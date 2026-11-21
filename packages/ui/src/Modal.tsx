"use client";

import { DialogFrame, type DialogA11yProps } from "./dialog-frame";

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
   *
   * ★ **画面の下端から出す面は `BottomSheet`**（#56）。`"bottom"` の意味は変えない
   *   （peco の 9 箇所が中央表示で使っている）。
   */
  position?: "center" | "bottom";
  /** Custom padding for the inner card (default "p-6") */
  padding?: string;
}

/**
 * 名前の付け方（`ariaLabel` / `ariaLabelledBy` を型で必須・`role="presentation"` の opt-out）は
 * `BottomSheet` と共有する。経緯（#1994: opt-in から opt-out へ反転）は `dialog-frame.tsx` に置いた。
 */
type ModalA11yProps = DialogA11yProps;

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
  if (!open) return null;

  // ユーザーFB (2026-08-16): スマホでモーダルが下に張り付くのを中央表示に統一。
  //   position="bottom" もモバイルで items-end にせず、常に中央に置く。
  //   ★ 下から出す面が要る画面は `BottomSheet`（#56）。ここの値は変えない
  //     （peco の position="bottom" 9 箇所の見た目を固定しているため）。
  const positionClass = "items-center justify-center";

  // W4-1 (#681): 内容が縦に長いと画面外へはみ出し、ヘッダや保存ボタンに届かなく
  //   なる。position="bottom" のシートには高さ上限 + スクロールを与え、
  //   overscroll-contain で背景へのスクロール伝播 (= タップ誤判定の原因) を防ぐ。
  const overflowClass =
    position === "bottom" ? "max-h-[90vh] overflow-y-auto overscroll-contain" : "";

  // 暗転面・aria 属性・フォーカス / Escape / Tab の折り返し / 閉じたら戻す・portal は
  // `dialog-frame.tsx`（BottomSheet と共有）。ここはクラス列だけを渡す（DOM は従来と同じ）。
  const a11y = { role, ariaModal, ariaLabel, ariaLabelledBy } as DialogA11yProps;
  return (
    <DialogFrame
      open={open}
      onClose={onClose}
      {...a11y}
      overlayClassName={`fixed inset-0 z-50 flex bg-black/40 p-4 ${positionClass}`}
      panelClassName={`w-full ${maxWidth} rounded-2xl bg-card ${padding} shadow-xl outline-none ${overflowClass}`}
    >
      {children}
    </DialogFrame>
  );
}

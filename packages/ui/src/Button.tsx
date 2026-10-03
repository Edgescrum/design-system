import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

/**
 * variant は 2026-09-27 監査（docs/audit-2026-09-27.md §1）の実測 9 分類から
 * warning（10 件・Badge の warning tone で足りる）を除いた 8 種。
 * 名前と構成は peco のインライン実装の最頻値に合わせてある — 発明ではなく正規化。
 *
 * `danger-outline` / `danger-text` は #11 の裁定（2026-10-04）で追加した 9・10 種目。
 * peco の DangerZone 4 役割（トリガー=danger-outline / 確定=danger /
 * 取消=secondary / テキスト=danger-text）を完全移行するためのもの。
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "soft"
  | "outline"
  | "ghost"
  | "danger"
  | "danger-outline"
  | "danger-text"
  | "success"
  | "inverse";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 行いっぱいに広げる（モバイルの主 CTA で最頻のレイアウト） */
  fullWidth?: boolean;
}

/**
 * 監査で 7 段階に分裂していた disabled 表現と 3 値あった押下スケールをここで一本化:
 * disabled は `opacity-50 + cursor-not-allowed`、active は `scale-[0.98]`
 * （globals.css のタッチフィードバック transition がカバーする 2 値のうちの既定側）。
 */
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold " +
  "transition active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

/** タップ領域は min-h で下から支える（監査で 4 流派あった担保方法の一本化。md=44px） */
const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-xs",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-4 py-3.5 text-sm",
};

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-dark",
  secondary: "border border-border bg-card text-foreground hover:bg-background",
  soft: "bg-accent-bg text-accent-dark hover:bg-accent/15",
  outline: "border border-border bg-transparent text-foreground hover:bg-background",
  ghost: "text-foreground hover:bg-background",
  danger: "bg-danger text-on-accent hover:opacity-90",
  /**
   * DangerZone のトリガー（DANGER_TRIGGER_CLASS の写し）。元実装に hover は無い
   * （モバイルファースト・タッチ主体）ので足さないこと — 発明ではなく正規化。
   */
  "danger-outline": "border border-danger-border bg-card text-danger",
  /** DangerZone の赤テキスト（DANGER_TEXT_CLASS の写し）。同じく hover なし */
  "danger-text": "text-danger",
  /** LINE 関連 CTA 専用（友だち追加・LINE で開く等）。UI 一般の成功には使わない */
  success: "bg-success text-on-accent hover:opacity-90",
  inverse: "bg-foreground text-on-accent hover:opacity-90",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(BASE, SIZE[size], VARIANT[variant], fullWidth && "w-full", className)}
      {...rest}
    />
  );
}

/**
 * `<Link>` / `<a>` にボタンの見た目を与えるためのクラス生成（監査でボタン風リンクが 131 件）。
 * next/link に依存しないよう、コンポーネントではなく className を返す。
 */
export function buttonClass(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  const { variant = "primary", size = "md", fullWidth = false, className } = options ?? {};
  return cx(BASE, SIZE[size], VARIANT[variant], fullWidth && "w-full", className);
}

import type { HTMLAttributes } from "react";
import { cx } from "./cx";

/**
 * tone × variant × size の 3 軸（2026-09-27 監査 §2 のインライン 191 件の正規化）。
 * サイズの実値は最頻組合せ: sm = `px-2 py-0.5 text-3xs font-bold`（53 件）、
 * md = `px-2.5 py-1 text-xs font-semibold`（InvoiceStatusBadge 準拠）。
 */
export type BadgeTone = "neutral" | "accent" | "danger" | "warning" | "positive" | "info";
export type BadgeVariant = "solid" | "soft" | "outline";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** 状態インジケータのドット（InvoiceStatusBadge のパターン） */
  withDot?: boolean;
}

const BASE = "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full";

const SIZE: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-3xs font-bold",
  md: "px-2.5 py-1 text-xs font-semibold",
};

const TONE: Record<BadgeTone, Record<BadgeVariant, string>> = {
  neutral: {
    solid: "bg-muted text-on-accent",
    soft: "bg-background text-muted",
    outline: "bg-card text-muted ring-1 ring-inset ring-border",
  },
  accent: {
    solid: "bg-accent text-on-accent",
    soft: "bg-accent-bg text-accent-dark",
    outline: "bg-card text-accent-dark ring-1 ring-inset ring-accent/30",
  },
  danger: {
    solid: "bg-danger text-on-accent",
    soft: "bg-danger-bg text-danger",
    outline: "bg-card text-danger ring-1 ring-inset ring-danger/30",
  },
  warning: {
    solid: "bg-warning text-on-accent",
    soft: "bg-warning-bg text-warning",
    outline: "bg-card text-warning ring-1 ring-inset ring-warning/30",
  },
  positive: {
    solid: "bg-positive text-on-accent",
    soft: "bg-positive-bg text-positive",
    outline: "bg-card text-positive ring-1 ring-inset ring-positive/30",
  },
  info: {
    solid: "bg-info text-on-accent",
    soft: "bg-info-bg text-info",
    outline: "bg-card text-info ring-1 ring-inset ring-info/30",
  },
};

const DOT_TONE: Record<BadgeTone, string> = {
  neutral: "bg-muted",
  accent: "bg-accent",
  danger: "bg-danger",
  warning: "bg-warning",
  positive: "bg-positive",
  info: "bg-info",
};

export function Badge({
  tone = "neutral",
  variant = "soft",
  size = "md",
  withDot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span className={cx(BASE, SIZE[size], TONE[tone][variant], className)} {...rest}>
      {withDot && (
        <span
          aria-hidden
          className={cx(
            "rounded-full",
            size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5",
            variant === "solid" ? "bg-on-accent/80" : DOT_TONE[tone]
          )}
        />
      )}
      {children}
    </span>
  );
}

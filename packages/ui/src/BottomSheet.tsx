"use client";

/**
 * 画面の下端から出るシート（#56・peco 要件 27 §7「確認シートは下から」）。
 *
 * ## なぜ `Modal` の新しい値ではなく別の部品なのか
 *
 * `Modal` の `position="bottom"` は**名前に反して中央に出る**（2026-08-16 の運用者 FB で
 * 全モーダルを中央に統一した下位互換）。peco では **9 箇所（7 ファイル）** がこの値を
 * 中央表示として使っており、`Modal` 全体の呼び出しは 33 箇所（29 ファイル）ある（dev 2026-11-21）。
 *
 * - `position="bottom"` を本当に下から出す → 9 箇所の見た目が変わる。採らない
 * - `Modal` に新しい値（`position="sheet"` / `placement="sheet"`）を足す → 「bottom なのに中央」の隣に
 *   「sheet は下」が並び、`position="bottom" placement="sheet"` のような組み合わせの意味も決めることになる。
 *   さらに閉じる動き（`motion.transition.sheet-exit`）を見せるには閉じたあとも DOM を残す必要があり、
 *   **33 箇所すべての描画の仕組みが変わる**。採らない
 * - **別の部品にする**（これ）→ `Modal` の描画の経路は変えない（DOM は 1 バイトも変わらないことを
 *   verify:modal と test/Modal.test.tsx が固定）。振る舞いは枠（`dialog-frame.tsx`）と
 *   `dialog-behavior.ts` を共有するので、2 本目の実装にはならない
 *
 * ## 振る舞い（Modal と同じ。枠を共有している）
 *
 * - `role="dialog"`・`aria-modal`。名前は**見出し（`title`）**から `aria-labelledby` で付ける
 *   （見えている見出しと読み上げの名前がずれない）
 * - 開いたらシート自身へフォーカス、Escape と背景タップで `onClose`、Tab はシートの中で折り返し、
 *   閉じたら呼び出し元へフォーカスを戻す
 * - 送信中は閉じない: `onClose={submitting ? () => {} : onClose}` を渡す（Modal と同じ約束）
 *
 * ## 動き
 *
 * - 入る: 下から `motion.transition.sheet-enter`（250ms・productive enter）、暗転面は同じ時間で色が濃くなる
 * - 出る: 下へ `motion.transition.sheet-exit`（250ms・productive exit）。**閉じた瞬間にフォーカスは戻り、
 *   シートは `inert` になって押せなくなる**（動きの終わりを待ってから次の操作を受け付ける作りにしない・
 *   sheet-exit の never）。動きが終わったら DOM から外す
 * - 動きを減らす設定: 位置は動かさず、透明度と暗転面の色だけを `motion.duration.feedback`（150ms）で変える
 *   （tokens.css がこの設定で sheet-enter / exit を 0ms にするので、透明度の方は feedback で上書きする）
 *
 * ## 見た目（Figma Screen `eeGgw8f0GYp5sAbvcX4Bqe` 418:267 / 418:297 / 418:331）
 *
 * 角丸は上だけ `radius.surface`・面は `bg-card`・内側の余白は `space.inset`（下だけ `space.group` +
 * ホームインジケーターの分）・見出しと中身の間も `space.inset`。スマホでは画面幅いっぱい、
 * 広い画面では `size.content.flow-compact`（1 列の集中画面の幅）で中央に寄せる。
 * 中身が高いときは画面の 9 割で止めてシートの中をスクロールする（操作行は SheetActions で下端に残す）。
 * 見出し以外（ボタン・閉じる ×・取っ手）は描かない。
 */

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { cx } from "./cx";
import { DialogFrame } from "./dialog-frame";

/** React 18 のサーバー描画で useLayoutEffect の警告を出さない */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface BottomSheetProps {
  /** 開いているか。閉じる動きのあいだは false のまま DOM が残る（もう操作は受け付けない） */
  open: boolean;
  /**
   * Escape・背景タップで呼ぶ。**「閉じる」ではなく「取り消す」を渡すこと**（Modal と同じ・#2212）。
   * 送信中は何もしない関数を渡す（`onClose={submitting ? () => {} : onClose}`）。
   */
  onClose: () => void;
  /** 見出し（16 字まで）。シートの一番上に描き、ダイアログの名前（`aria-labelledby`）にもなる */
  title: string;
  /** 見出しの下に縦に並べる中身。間は `space.inset`（部品が持つ） */
  children: React.ReactNode;
}

/** `transition-duration` / `transition-delay` の値（"0.25s, 150ms"）をミリ秒の配列にする */
function toMs(value: string): number[] {
  return value.split(",").map((raw) => {
    const t = raw.trim();
    const n = Number.parseFloat(t);
    if (!Number.isFinite(n)) return 0;
    return t.endsWith("ms") ? n : n * 1000;
  });
}

/**
 * 閉じる動きがいつ終わるか（ミリ秒）。要素に**いま効いている** transition から読む。
 *
 * 時間を JS に書き写さない（トークンを変えたら JS だけ取り残される）。動きを減らす設定では
 * feedback（150ms）、通常は sheet-exit（250ms）が返る。transition の無い環境（jsdom など）は 0。
 * `transitionend` を待たないのは、動きを減らす設定で位置の transition が 0ms になると
 * そのプロパティの `transitionend` が来ないため（来ないイベントを待つと DOM が残り続ける）。
 */
function exitDurationMs(elements: Array<HTMLElement | null>): number {
  let longest = 0;
  for (const el of elements) {
    if (!el) continue;
    const style = window.getComputedStyle(el);
    const durations = toMs(style.transitionDuration || "0s");
    const delays = toMs(style.transitionDelay || "0s");
    durations.forEach((d, i) => {
      longest = Math.max(longest, d + (delays[i % delays.length] ?? 0));
    });
  }
  return longest;
}

// ── クラス（動きはトークンだけ。値を直書きしない） ─────────────────────────────────

/** 暗転面。押すと `onClose`（枠が持つ）。シートを下端・中央に置く */
const OVERLAY_BASE = cx(
  "fixed inset-0 z-50 flex items-end justify-center",
  // 動きを減らす設定: 色の変化だけを feedback で残す（sheet-enter / exit はこの設定で 0ms になる）
  "motion-reduce:transition-colors motion-reduce:duration-feedback motion-reduce:ease-productive-standard"
);
const OVERLAY_STATE = {
  open: "bg-black/40 [transition:background-color_var(--motion-transition-sheet-enter)]",
  // 閉じる動きのあいだは押せない（inert も付く）。押した指が下の画面に届くようにする
  closed: "pointer-events-none bg-transparent [transition:background-color_var(--motion-transition-sheet-exit)]",
} as const;

/** シート本体 */
const PANEL_BASE = cx(
  "relative flex w-full max-w-content-flow-compact max-h-9/10 flex-col gap-inset",
  "overflow-y-auto overscroll-contain",
  "rounded-t-surface bg-card px-inset pt-inset pb-[calc(var(--space-group)+env(safe-area-inset-bottom))]",
  "outline-none",
  // 動きを減らす設定: 位置は動かさず、透明度だけを feedback で変える
  "motion-reduce:translate-y-0 motion-reduce:transition-opacity motion-reduce:duration-feedback motion-reduce:ease-productive-standard"
);
const PANEL_STATE = {
  open: "translate-y-0 [transition:translate_var(--motion-transition-sheet-enter)]",
  closed: "translate-y-full [transition:translate_var(--motion-transition-sheet-exit)] motion-reduce:opacity-0",
} as const;

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const titleId = `${useId()}-title`;
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /** DOM に置いているか（閉じる動きのあいだも true） */
  const [present, setPresent] = useState(open);
  /** 入る動きの始点（下に隠れた状態）を 1 回描いたか */
  const [entered, setEntered] = useState(false);

  // 開いたら同じ描画で DOM に置く（Modal と同じく、render の直後にダイアログがある）
  if (open && !present) setPresent(true);

  // 入る動き: 下に隠れた状態を確定させてから（スタイルを計算させてから）開いた状態へ切り替える。
  // layout effect なので、隠れた状態は画面に描かれない
  useIsomorphicLayoutEffect(() => {
    if (!open || !present) return;
    panelRef.current?.getBoundingClientRect();
    setEntered(true);
  }, [open, present]);

  // 閉じる動きのあいだは操作を受け付けない（フォーカス・クリック・読み上げから外す）。
  // `inert` は React 18 / 19 で props の扱いが違うので DOM に直接付ける
  useIsomorphicLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    if (open) overlay.removeAttribute("inert");
    else overlay.setAttribute("inert", "");
  }, [open, present]);

  // 閉じる動きが終わったら DOM から外す
  useEffect(() => {
    if (open || !present) return;
    const finish = () => {
      setPresent(false);
      setEntered(false);
    };
    const wait = exitDurationMs([overlayRef.current, panelRef.current]);
    if (wait <= 0) {
      finish();
      return;
    }
    const timer = window.setTimeout(finish, wait);
    return () => window.clearTimeout(timer);
  }, [open, present]);

  if (!present) return null;

  const state = open && entered ? "open" : "closed";

  return (
    <DialogFrame
      open={open}
      onClose={onClose}
      ariaLabelledBy={titleId}
      overlayRef={overlayRef}
      panelRef={panelRef}
      dataState={state}
      overlayClassName={cx(OVERLAY_BASE, OVERLAY_STATE[state])}
      panelClassName={cx(PANEL_BASE, PANEL_STATE[state])}
    >
      <h2 id={titleId} className="text-role-heading font-emphasis leading-normal text-foreground">
        {title}
      </h2>
      {children}
    </DialogFrame>
  );
}

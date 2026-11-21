"use client";

/**
 * ラベル・見出しの横の i マークと、押すと出る説明のポップアップ（#53）。
 * 段階的表示の 2 段目（peco docs/v2/requirements/25_design-system.md §10-10）。
 *
 * ## 振る舞い（§10-10 の表をそのまま部品に入れてある）
 *
 * - **押して開く**。ホバーでは開かない（スマホにホバーが無い。PC もクリック）
 * - 閉じるのは **外側を押す・Esc・もう一度 i を押す・ポップアップ自体を押す**・
 *   フォーカスが他の要素へ移る
 *   - ★ §10-10 は「× で閉じる」と書くが、Figma の `InfoTip/Popover`（Screen 412:300）に
 *     × は無い。見た目は Figma に合わせて × を描かず、**ポップアップ全体を × の代わりにした**。
 *     開いたポップアップが下の行の i や Toggle に重なると、押しても何も起きない面が残るため
 *     （Storybook の OneAtATime で実測）。文字を選んでいるあいだは閉じない
 * - **同時に開くのはページ全体で 1 つ**（下の `openId` ストア。別の i を押すと前のものが閉じる）
 * - 中身は**文字列だけ**（`children: string`）。ボタン・リンクを入れられないことを型で止める
 *   （Modal の「名前を型で必須にする」と同じ考え方。ソース走査の lint より漏れない）
 *
 * ## 読み上げ
 *
 * - トリガーは `<button>`。名前は `aria-label="<label> の説明"`、開閉は `aria-expanded`
 * - ポップアップは **`role="dialog"` にしない**（§10-10）。`aria-controls` と
 *   `aria-describedby` でトリガーから指す。閉じているあいだも `aria-describedby` は外さない —
 *   直接参照された非表示の要素も説明の計算に入る（accname）ので、読み上げの利用者は
 *   開かなくても i にフォーカスした時点で説明を聞ける
 * - ポップアップの中にフォーカスできる要素は無い（中身は文字列だけ）。だからフォーカスは
 *   トリガーから動かさず、フォーカストラップも持たない（ダイアログではないため）
 *
 * ## ポップアップを `document.body` に portal する理由
 *
 * 最初の利用先（peco の予約設定）のカードを含め、peco には `overflow-hidden` の
 * 角丸カードが 20 箇所以上ある。カードの中に `absolute` で描くと**ポップアップが切れる**。
 * `fixed` でも、祖先に `transform` / `translate` / `backdrop-filter` があると
 * そこが基準になって位置がずれる（Modal に開閉の動きを入れると踏む）。
 * body 直下に出して、位置は i の矩形から毎回計算する。
 *
 * ## Escape と Modal
 *
 * Modal（`dialog-behavior.ts`）は `document` の **bubble** で Escape を拾い、
 * `defaultPrevented` なら降りる約束になっている。InfoTip は **capture** で先に拾って
 * `preventDefault()` するので、**Modal の中の InfoTip で Esc を押すと InfoTip だけが閉じる**
 * （2 回目の Esc で Modal が閉じる）。
 *
 * ## 動き
 *
 * 出入りは `motion.duration.surface`（250ms）・作業用イージング（入る `productive-enter` /
 * 出る `productive-exit`）。動きを減らす設定では位置の動きを消し、透明度だけを
 * `motion.duration.feedback`（150ms・この設定でも残る時間）で変える。
 * 閉じたあとも要素は残して `invisible` にする（出ていく動きを最後まで見せるため）。
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { cx } from "./cx";
import { InfoIcon } from "./icons";

// ── 同時に開くのは 1 つ（ページ全体で 1 本のストア） ──────────────────────────────
//
// module スコープなのでタブ内で 1 本。各 InfoTip は `openId === 自分の id` を購読する。
// 「開く」は openId を自分に書き換えるだけなので、前に開いていたものは自動で閉じる。

let openId: string | null = null;
const listeners = new Set<() => void>();

function setOpenId(next: string | null) {
  if (openId === next) return;
  openId = next;
  for (const listener of listeners) listener();
}

function subscribeOpenId(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ── portal はクライアントでだけ描く ────────────────────────────────────────────
//
// サーバーには document が無いので portal を作れない。サーバーとハイドレーションでは
// false、ハイドレーション後に true（useSyncExternalStore がサーバー用の値で描いてから
// 描き直す）。不一致エラーを出さずにポップアップを足せる。

const subscribeNothing = () => () => {};
const onClient = () => true;
const onServer = () => false;

/** React 18 のサーバー描画で useLayoutEffect の警告を出さない */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Placement = "below" | "above";

interface Position {
  top: number;
  left: number;
  placement: Placement;
}

/**
 * i の矩形からポップアップの位置を決める（`position: fixed` の座標）。
 *
 * - 横: ポップアップの左端を i の左端に合わせ、画面の左右の余白
 *   （`space.page.inline`・本文の左右余白と同じ）の内側に収める
 * - 縦: 下に出す。下に入らず上に入るときだけ上に出す
 *
 * px を直書きしないため、余白はポップアップ自身の計算済みスタイルから読む:
 *   - i との間: `margin-top`（クラス `mt-related` = `space.related`）
 *   - 画面の左右: `max-width`（`100vw - 2 × space.page.inline`）から逆算
 */
function computePosition(trigger: HTMLElement, popover: HTMLElement): Position {
  const anchor = trigger.getBoundingClientRect();
  const style = window.getComputedStyle(popover);
  const gap = Number.parseFloat(style.marginTop) || 0;
  const maxWidth = Number.parseFloat(style.maxWidth);
  const gutter = Number.isFinite(maxWidth) ? Math.max(0, (window.innerWidth - maxWidth) / 2) : 0;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const width = popover.offsetWidth;
  const height = popover.offsetHeight;

  const left = Math.max(gutter, Math.min(anchor.left, viewportWidth - gutter - width));
  const fitsBelow = anchor.bottom + gap + height <= viewportHeight;
  const fitsAbove = anchor.top - gap - height >= 0;
  const placement: Placement = !fitsBelow && fitsAbove ? "above" : "below";
  // margin-top（gap）は上に出すときも効くので、その分を 2 回引いて i との間を gap にする
  const top = placement === "below" ? anchor.bottom : anchor.top - height - 2 * gap;
  return { top, left, placement };
}

export interface InfoTipProps {
  /**
   * 読み上げ用のラベル名。**横に並んでいるラベル・見出しと同じ文言**を渡す。
   * トリガーの名前は「<label> の説明」になる。
   */
  label: string;
  /**
   * 説明。**3 文まで**。文字列だけを受け取る（ボタン・リンクは型で入らない）。
   * 常に見えている必要がある注意・エラー・入力の必須条件は入れない（画面に出す）。
   */
  children: string;
}

export function InfoTip({ label, children }: InfoTipProps) {
  const id = useId();
  const popoverId = `${id}-popover`;
  const open = useSyncExternalStore(subscribeOpenId, () => openId === id, onServer);
  const isClient = useSyncExternalStore(subscribeNothing, onClient, onServer);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  /** 自分が開いているときだけ閉じる（別の InfoTip を閉じない） */
  const close = useCallback(() => {
    if (openId === id) setOpenId(null);
  }, [id]);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    const next = computePosition(trigger, popover);
    setPosition((prev) =>
      prev &&
      prev.top === next.top &&
      prev.left === next.left &&
      prev.placement === next.placement
        ? prev
        : next
    );
  }, []);

  // 開いた瞬間、描画の前に位置を決める（左上に一瞬出てから動く、を起こさない）
  useIsomorphicLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  // 開いているあいだだけ: Esc・外側を押す・スクロールとリサイズへの追従
  useEffect(() => {
    if (!open) return;
    let frame = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // Modal（dialog-behavior）は defaultPrevented を見て降りる。InfoTip だけを閉じる
      e.preventDefault();
      close();
    };
    const onPointerDown = (e: Event) => {
      const target = e.target as Node | null;
      if (target && (triggerRef.current?.contains(target) || popoverRef.current?.contains(target))) {
        // i 自身とポップアップは外側ではない（どちらも続く click で閉じる。ここで閉じると
        // i の押し直しが「閉じてすぐ開く」になる）
        return;
      }
      close();
    };
    const onViewportChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    // scroll は bubble しないので capture で拾う（カードやモーダルの中のスクロールも含める）
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [open, close, place]);

  // 開いたまま消えたら、ストアに自分の id を残さない
  useEffect(() => close, [close]);

  const placement = position?.placement ?? "below";

  const popover = (
    <div
      ref={popoverRef}
      id={popoverId}
      data-state={open ? "open" : "closed"}
      data-placement={placement}
      style={{ top: position?.top ?? 0, left: position?.left ?? 0 }}
      // × の代わり。説明の文字を選んでいる（コピーしようとしている）ときは閉じない。
      // portal の click は React の木を伝って InfoTip の親へ届く（DOM の親ではないのに）。
      // 行全体が押せる親などを動かさないよう、ここで止める
      onClick={(e) => {
        e.stopPropagation();
        if (window.getSelection()?.toString()) return;
        close();
      }}
      className={cx(
        "fixed z-60 mt-related w-70 max-w-[calc(100vw-2*var(--space-page-inline))]",
        "rounded-control-sm border border-border bg-card p-inset shadow-lg",
        "text-role-help font-regular leading-relaxed text-foreground",
        "transition-[opacity,translate,visibility] duration-surface",
        "motion-reduce:translate-y-0 motion-reduce:duration-feedback",
        open
          ? "visible translate-y-0 opacity-100 ease-productive-enter"
          : cx(
              "invisible opacity-0 ease-productive-exit",
              placement === "above" ? "translate-y-1" : "-translate-y-1"
            )
      )}
    >
      {children}
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label} の説明`}
        aria-expanded={open}
        // サーバーの HTML にはポップアップが無いので、宙に浮いた参照を出さない
        aria-controls={isClient ? popoverId : undefined}
        aria-describedby={isClient ? popoverId : undefined}
        data-state={open ? "open" : "closed"}
        onClick={() => setOpenId(open ? null : id)}
        onBlur={(e) => {
          // Tab などでフォーカスが他の要素へ移ったら閉じる（行き先が無い = 何も無い所を押した、は
          // 外側を押した処理に任せる）
          const next = e.relatedTarget as Node | null;
          if (next && !popoverRef.current?.contains(next)) close();
        }}
        className={cx(
          // 見た目の枠は 24px（Figma の InfoTip と同じ）。アイコンは 16px
          "relative inline-flex size-6 shrink-0 items-center justify-center rounded-full",
          // 押せる範囲は 44px 四方。枠の中心に重ねた ::before で広げる（行の高さは増やさない）
          "before:absolute before:top-1/2 before:left-1/2 before:size-11 before:-translate-1/2",
          "transition-colors duration-feedback ease-productive-standard",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          open ? "text-accent" : "text-muted"
        )}
      >
        <InfoIcon aria-hidden="true" />
      </button>
      {isClient && createPortal(popover, document.body)}
    </>
  );
}

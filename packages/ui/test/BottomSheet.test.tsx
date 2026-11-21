/**
 * BottomSheet（#56・peco 要件 27 §7「確認シートは下から」）の振る舞い。
 *
 * Modal と同じ振る舞い（role=dialog・名前・フォーカス移動・Escape・背景タップ・Tab の折り返し・
 * 閉じたら戻す・送信中は閉じない）を、枠（dialog-frame）を共有して持っていること。
 * それに加えて、閉じる動き（sheet-exit）のあいだ DOM を残し、そのあいだは操作を受け付けないこと。
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BottomSheet } from "../src/BottomSheet";
import { __openDialogCountForTest } from "../src/dialog-behavior";
import { InfoTip } from "../src/InfoTip";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.head.querySelectorAll("style[data-test-motion]").forEach((el) => el.remove());
});

const TITLE = "2 組をまとめます";

function sheet() {
  return screen.getByRole("dialog", { name: TITLE });
}
/** 暗転面（= 押すと閉じる面）。シートの親 */
function overlayOf(dialog: HTMLElement) {
  return dialog.parentElement!;
}

/** 呼び出し元のボタン + シート。閉じたら戻す・閉じる動きを試す */
function Demo({ onCloseSpy, submitting = false }: { onCloseSpy?: () => void; submitting?: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onCloseSpy?.();
    setOpen(false);
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        選んだ 2 組をまとめる
      </button>
      <BottomSheet open={open} onClose={submitting ? () => {} : close} title={TITLE}>
        <p>仮登録の予約・請求・メモを、LINE 登録済みのお客さまに移します</p>
        <div>
          <button type="button" onClick={close}>
            戻る
          </button>
          <button type="button">まとめる</button>
        </div>
      </BottomSheet>
    </>
  );
}

function openDemo(props: Parameters<typeof Demo>[0] = {}) {
  render(<Demo {...props} />);
  const opener = screen.getByRole("button", { name: "選んだ 2 組をまとめる" });
  act(() => opener.focus());
  fireEvent.click(opener);
  return opener;
}

/** 閉じる動きの長さを CSS で与える（jsdom は Tailwind を読まないので、getComputedStyle に効く形で） */
function giveExitMotion(ms: number) {
  const style = document.createElement("style");
  style.setAttribute("data-test-motion", "");
  style.textContent = `[data-state="closed"] { transition-duration: ${ms}ms; }`;
  document.head.appendChild(style);
}

describe("BottomSheet — 読み上げ", () => {
  it("role=dialog・aria-modal で、名前は見出し（aria-labelledby）", () => {
    render(
      <BottomSheet open onClose={() => {}} title={TITLE}>
        <p>本文</p>
      </BottomSheet>
    );
    const dialog = sheet();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const heading = screen.getByRole("heading", { level: 2, name: TITLE });
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(dialog.contains(heading)).toBe(true);
    // 見出しは中身より前（シートの一番上）
    expect(dialog.firstElementChild).toBe(heading);
  });

  it("document.body の直下に出る（親の overflow や transform に切られない）", () => {
    render(
      <div data-testid="parent" style={{ overflow: "hidden" }}>
        <BottomSheet open onClose={() => {}} title={TITLE}>
          <p>本文</p>
        </BottomSheet>
      </div>
    );
    expect(overlayOf(sheet()).parentElement).toBe(document.body);
    expect(screen.getByTestId("parent").contains(sheet())).toBe(false);
  });

  it("閉じているときは何も描かない", () => {
    render(
      <BottomSheet open={false} onClose={() => {}} title={TITLE}>
        <p>本文</p>
      </BottomSheet>
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("本文")).toBeNull();
  });

  // サーバー描画（document が無い）は verify.mjs の verify:bottom-sheet が Node で見る
  // （ここは jsdom なので document がある）
});

describe("BottomSheet — Modal と同じ振る舞い", () => {
  it("開くとシート自身にフォーカスが移る", () => {
    openDemo();
    expect(document.activeElement).toBe(sheet());
  });

  it("Escape で onClose（= 取り消し）が呼ばれる", () => {
    const onClose = vi.fn();
    openDemo({ onCloseSpy: onClose });
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("背景（暗転面）を押すと onClose、シートの中を押しても閉じない", () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose} title={TITLE}>
        <p>本文</p>
      </BottomSheet>
    );
    fireEvent.click(screen.getByText("本文"));
    fireEvent.click(sheet());
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(overlayOf(sheet()));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("シートの中の click は React の親（押せる行など）へ届かない", () => {
    const onParentClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <BottomSheet open onClose={() => {}} title={TITLE}>
          <button type="button">まとめる</button>
        </BottomSheet>
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: "まとめる" }));
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it("Tab はシートの中で折り返す（最後 → 最初・開いた直後の Shift+Tab → 最後）", () => {
    openDemo();
    const back = screen.getByRole("button", { name: "戻る" });
    const merge = screen.getByRole("button", { name: "まとめる" });

    // 開いた直後（フォーカスはシート自身）の Shift+Tab は外へ出ずに最後へ
    fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(merge);

    // 最後で Tab → 最初へ
    fireEvent.keyDown(merge, { key: "Tab" });
    expect(document.activeElement).toBe(back);
  });

  it("閉じたら呼び出し元のボタンへフォーカスが戻る", () => {
    const opener = openDemo();
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(document.activeElement).toBe(opener);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("送信中（onClose に何もしない関数）は Escape でも背景タップでも閉じない", () => {
    openDemo({ submitting: true });
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    fireEvent.click(overlayOf(sheet()));
    expect(sheet()).toBeTruthy();
  });

  it("中の InfoTip で Esc を押すと InfoTip だけが閉じ、2 回目でシートが閉じる", () => {
    const onClose = vi.fn();
    function WithTip() {
      const [open, setOpen] = useState(true);
      return (
        <BottomSheet
          open={open}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
          title={TITLE}
        >
          <InfoTip label="まとめると何が移るか">予約・請求・メモが移ります。</InfoTip>
        </BottomSheet>
      );
    }
    render(<WithTip />);
    const tip = screen.getByRole("button", { name: "まとめると何が移るか の説明" });
    fireEvent.click(tip);
    expect(tip.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(tip.getAttribute("aria-expanded")).toBe("false");
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("閉じたあと、開いているダイアログの記録（重なり順）を残さない", () => {
    openDemo();
    expect(__openDialogCountForTest()).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(__openDialogCountForTest()).toBe(0);
  });
});

describe("BottomSheet — 入る動き・閉じる動き", () => {
  it("開いた描画のうちに open の状態になる（下に隠れた状態のままにならない）", () => {
    openDemo();
    const dialog = sheet();
    expect(dialog.getAttribute("data-state")).toBe("open");
    expect(overlayOf(dialog).getAttribute("data-state")).toBe("open");
  });

  it("閉じる動きのあいだは DOM に残るが inert（押せない・読まれない）、終わったら外れる", () => {
    vi.useFakeTimers();
    giveExitMotion(250);
    const opener = openDemo();
    const dialog = sheet();
    const overlay = overlayOf(dialog);
    expect(overlay.hasAttribute("inert")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "戻る" }));

    // 閉じた瞬間: フォーカスは呼び出し元に戻り、シートは下へ出ていく途中で押せない
    expect(document.activeElement).toBe(opener);
    expect(document.body.contains(dialog)).toBe(true);
    expect(dialog.getAttribute("data-state")).toBe("closed");
    expect(overlay.hasAttribute("inert")).toBe(true);
    expect(overlay.className).toContain("pointer-events-none");

    act(() => vi.advanceTimersByTime(249));
    expect(document.body.contains(dialog)).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(document.body.contains(dialog)).toBe(false);
  });

  it("閉じる動きの途中で開き直すと、外さずに open へ戻る", () => {
    vi.useFakeTimers();
    giveExitMotion(250);
    const opener = openDemo();
    const dialog = sheet();
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(dialog.getAttribute("data-state")).toBe("closed");

    act(() => vi.advanceTimersByTime(100));
    fireEvent.click(opener);
    expect(dialog.getAttribute("data-state")).toBe("open");
    expect(overlayOf(dialog).hasAttribute("inert")).toBe(false);

    act(() => vi.advanceTimersByTime(1000));
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("動きが無い環境（transition 0）では閉じた時点で外れる", () => {
    openDemo();
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("BottomSheet — 見た目と動きはトークンだけ", () => {
  function classesOf(el: Element) {
    return el.className.split(/\s+/);
  }

  it("入る / 出る は motion.transition.sheet-enter / sheet-exit。動きを減らす設定では位置を動かさず透明度だけ", () => {
    vi.useFakeTimers();
    giveExitMotion(250);
    openDemo();
    const dialog = sheet();
    const overlay = overlayOf(dialog);

    expect(classesOf(dialog)).toEqual(
      expect.arrayContaining(["translate-y-0", "[transition:translate_var(--motion-transition-sheet-enter)]"])
    );
    expect(classesOf(overlay)).toEqual(
      expect.arrayContaining(["bg-black/40", "[transition:background-color_var(--motion-transition-sheet-enter)]"])
    );
    // 動きを減らす設定: 位置は 0 に固定し、透明度・色だけを feedback で変える
    expect(classesOf(dialog)).toEqual(
      expect.arrayContaining([
        "motion-reduce:translate-y-0",
        "motion-reduce:transition-opacity",
        "motion-reduce:duration-feedback",
      ])
    );
    expect(classesOf(overlay)).toEqual(
      expect.arrayContaining(["motion-reduce:transition-colors", "motion-reduce:duration-feedback"])
    );

    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(classesOf(dialog)).toEqual(
      expect.arrayContaining([
        "translate-y-full",
        "[transition:translate_var(--motion-transition-sheet-exit)]",
        "motion-reduce:opacity-0",
      ])
    );
    expect(classesOf(dialog)).not.toContain("[transition:translate_var(--motion-transition-sheet-enter)]");
    expect(classesOf(overlay)).toEqual(
      expect.arrayContaining(["bg-transparent", "[transition:background-color_var(--motion-transition-sheet-exit)]"])
    );
    for (const cls of [...classesOf(dialog), ...classesOf(overlay)]) {
      expect(cls).not.toMatch(/expressive/);
    }
  });

  it("下端・中央に置き、上だけ角丸・面はカード色・余白は用途のトークン", () => {
    render(
      <BottomSheet open onClose={() => {}} title={TITLE}>
        <p>本文</p>
      </BottomSheet>
    );
    const dialog = sheet();
    const overlay = overlayOf(dialog);
    expect(classesOf(overlay)).toEqual(expect.arrayContaining(["fixed", "inset-0", "items-end", "justify-center"]));
    expect(classesOf(dialog)).toEqual(
      expect.arrayContaining([
        "w-full",
        "max-w-content-flow-compact",
        "rounded-t-surface",
        "bg-card",
        "px-inset",
        "pt-inset",
        "gap-inset",
        "overflow-y-auto",
        "overscroll-contain",
      ])
    );
    // 見出しは文字の用途トークン
    const heading = screen.getByRole("heading", { level: 2 });
    expect(classesOf(heading)).toEqual(expect.arrayContaining(["text-role-heading", "font-emphasis"]));
    // 任意の値（`-[…]` / `[…]`）に生の長さ・時間・色・曲線を書いていない
    const arbitrary = `${dialog.className} ${overlay.className} ${heading.className}`.match(/\S*\[[^\]]*\]\S*/g) ?? [];
    expect(arbitrary.length).toBeGreaterThan(0);
    for (const cls of arbitrary) {
      expect(cls).not.toMatch(/\d(px|ms|s|rem|em)\b|#[0-9a-f]{3,8}\b|rgba?\(|cubic-bezier/i);
    }
  });
});

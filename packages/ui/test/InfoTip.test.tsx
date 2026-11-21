/**
 * InfoTip（#53・peco 25_design-system.md §10-10）の振る舞い。
 *
 * 受け入れの 5 点: 開閉 / Esc / 外側を押す / 同時に 1 つ / 読み上げの属性。
 * Esc は Modal の中に置いたときに **InfoTip だけ**が閉じることまで見る
 * （dialog-behavior の `defaultPrevented` の約束に乗っていることの確認）。
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InfoTip } from "../src/InfoTip";
import { Modal } from "../src/Modal";

afterEach(() => {
  cleanup();
});

const LABEL = "予約のたびにすぐ通知する";
const TEXT = "自分やスタッフが入れた予約・変更は届きません。オンにすると、毎朝のまとめから今日の予定を外します。";

function trigger(label = LABEL) {
  return screen.getByRole("button", { name: `${label} の説明` });
}

/** トリガーが指しているポップアップ（aria-controls の先） */
function popoverOf(button: HTMLElement) {
  const id = button.getAttribute("aria-controls");
  expect(id).toBeTruthy();
  const el = document.getElementById(id!);
  expect(el).not.toBeNull();
  return el!;
}

function isOpen(button: HTMLElement) {
  const expanded = button.getAttribute("aria-expanded") === "true";
  // 見た目の状態と読み上げの状態がずれていないこと
  expect(popoverOf(button).getAttribute("data-state")).toBe(expanded ? "open" : "closed");
  return expanded;
}

describe("InfoTip — 読み上げの属性", () => {
  it("トリガーは button で、名前は「<label> の説明」・閉じた状態で始まる", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const button = trigger();
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("aria-label")).toBe(`${LABEL} の説明`);
    expect(isOpen(button)).toBe(false);
  });

  it("ポップアップは role=dialog ではなく、aria-controls と aria-describedby の両方で指される", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const button = trigger();
    const popover = popoverOf(button);
    expect(button.getAttribute("aria-describedby")).toBe(popover.id);
    expect(popover.textContent).toBe(TEXT);
    expect(popover.getAttribute("role")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("閉じているあいだも説明として関連付いたまま（開かなくても読み上げで聞ける）", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const button = trigger();
    expect(isOpen(button)).toBe(false);
    expect(button.getAttribute("aria-describedby")).toBe(popoverOf(button).id);
  });

  it("i のアイコンは読み上げから外す", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const svg = trigger().querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("aria-hidden")).toBe("true");
    expect(svg!.getAttribute("width")).toBe("16");
    expect(svg!.getAttribute("height")).toBe("16");
  });

  it("サーバー描画ではポップアップを出さず、宙に浮いた aria-controls / aria-describedby も出さない", () => {
    const html = renderToString(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    expect(html).toContain(`aria-label="${LABEL} の説明"`);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("aria-controls");
    expect(html).not.toContain("aria-describedby");
    expect(html).not.toContain(TEXT);
  });
});

describe("InfoTip — 開閉", () => {
  it("押すと開き、もう一度押すと閉じる", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const button = trigger();
    fireEvent.click(button);
    expect(isOpen(button)).toBe(true);
    fireEvent.click(button);
    expect(isOpen(button)).toBe(false);
  });

  it("ホバーでは開かない", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const button = trigger();
    fireEvent.pointerEnter(button);
    fireEvent.mouseEnter(button);
    fireEvent.mouseOver(button);
    expect(isOpen(button)).toBe(false);
  });

  it("ポップアップは document.body の直下に出る（overflow-hidden のカードで切れない）", () => {
    render(
      <div data-testid="card" style={{ overflow: "hidden" }}>
        <InfoTip label={LABEL}>{TEXT}</InfoTip>
      </div>
    );
    const popover = popoverOf(trigger());
    expect(popover.parentElement).toBe(document.body);
    expect(screen.getByTestId("card").contains(popover)).toBe(false);
  });

  it("開いたまま消えても、次に置いた InfoTip が普通に開閉できる", () => {
    const first = render(<InfoTip label="一つ目">{TEXT}</InfoTip>);
    fireEvent.click(trigger("一つ目"));
    expect(isOpen(trigger("一つ目"))).toBe(true);
    first.unmount();

    render(<InfoTip label="二つ目">{TEXT}</InfoTip>);
    const button = trigger("二つ目");
    expect(isOpen(button)).toBe(false);
    fireEvent.click(button);
    expect(isOpen(button)).toBe(true);
  });
});

describe("InfoTip — Esc", () => {
  it("Esc で閉じる", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const button = trigger();
    fireEvent.click(button);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(isOpen(button)).toBe(false);
  });

  it("閉じているときの Esc は横取りしない（defaultPrevented にしない）", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("Modal の中で Esc を押すと InfoTip だけが閉じ、2 回目で Modal が閉じる", () => {
    const onClose = vi.fn();
    function Demo() {
      const [open, setOpen] = useState(true);
      return (
        <Modal
          open={open}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
          ariaLabel="通知の設定"
        >
          <span>{LABEL}</span>
          <InfoTip label={LABEL}>{TEXT}</InfoTip>
        </Modal>
      );
    }
    render(<Demo />);
    const button = trigger();
    fireEvent.click(button);
    expect(isOpen(button)).toBe(true);

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(isOpen(button)).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("InfoTip — 外側を押す", () => {
  it("外側を押すと閉じる", () => {
    render(
      <div>
        <p data-testid="outside">ほかの文字</p>
        <InfoTip label={LABEL}>{TEXT}</InfoTip>
      </div>
    );
    const button = trigger();
    fireEvent.click(button);
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(isOpen(button)).toBe(false);
  });

  it("ポップアップ自体を押すと閉じる（× の代わり）。押し下げの時点では外側扱いしない", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const button = trigger();
    fireEvent.click(button);
    const popover = popoverOf(button);
    // 実ブラウザの順: pointerdown → click
    fireEvent.pointerDown(popover);
    expect(isOpen(button)).toBe(true);
    fireEvent.click(popover);
    expect(isOpen(button)).toBe(false);
  });

  it("説明の文字を選んでいるときは、ポップアップを押しても閉じない", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const button = trigger();
    fireEvent.click(button);
    const popover = popoverOf(button);
    const selection = window.getSelection()!;
    selection.selectAllChildren(popover);
    try {
      fireEvent.click(popover);
      expect(isOpen(button)).toBe(true);
    } finally {
      selection.removeAllRanges();
    }
  });

  it("ポップアップを押しても、DOM の親ではない React の親（押せる行など）へ click を渡さない", () => {
    const onRowClick = vi.fn();
    render(
      <div onClick={onRowClick}>
        <InfoTip label={LABEL}>{TEXT}</InfoTip>
      </div>
    );
    const button = trigger();
    fireEvent.click(button);
    onRowClick.mockClear();
    fireEvent.click(popoverOf(button));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("i 自身を押したときは外側扱いしない（押し直しで閉じる 1 回だけが効く）", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const button = trigger();
    fireEvent.click(button);
    // 実ブラウザの順: pointerdown → click
    fireEvent.pointerDown(button);
    expect(isOpen(button)).toBe(true);
    fireEvent.click(button);
    expect(isOpen(button)).toBe(false);
  });

  it("フォーカスが他の要素へ移ると閉じる", () => {
    render(
      <div>
        <InfoTip label={LABEL}>{TEXT}</InfoTip>
        <button type="button">次の操作</button>
      </div>
    );
    const button = trigger();
    const next = screen.getByRole("button", { name: "次の操作" });
    act(() => button.focus());
    fireEvent.click(button);
    expect(isOpen(button)).toBe(true);
    act(() => next.focus());
    expect(isOpen(button)).toBe(false);
  });
});

describe("InfoTip — 同時に開くのは 1 つ", () => {
  it("別の i を押すと、前に開いていたものが閉じる", () => {
    render(
      <div>
        <InfoTip label="当日予約を受け付ける">今日の空き枠をお客さまが予約できます。</InfoTip>
        <InfoTip label={LABEL}>{TEXT}</InfoTip>
      </div>
    );
    const a = trigger("当日予約を受け付ける");
    const b = trigger(LABEL);

    fireEvent.click(a);
    expect(isOpen(a)).toBe(true);
    expect(isOpen(b)).toBe(false);

    // 実ブラウザの順（pointerdown → click）でも、click だけでも 1 つになる
    fireEvent.pointerDown(b);
    fireEvent.click(b);
    expect(isOpen(a)).toBe(false);
    expect(isOpen(b)).toBe(true);

    fireEvent.click(a);
    expect(isOpen(a)).toBe(true);
    expect(isOpen(b)).toBe(false);
    expect(document.querySelectorAll('[data-state="open"][id]')).toHaveLength(1);
  });
});

describe("InfoTip — 動きと見た目はトークンだけ", () => {
  it("出入りは surface（250ms）・作業用イージング。動きを減らす設定では位置を動かさず透明度だけ", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const button = trigger();
    const popover = popoverOf(button);
    const classes = () => popover.className.split(/\s+/);

    expect(classes()).toEqual(expect.arrayContaining(["duration-surface", "ease-productive-exit", "invisible", "opacity-0"]));
    expect(classes()).toEqual(expect.arrayContaining(["motion-reduce:translate-y-0", "motion-reduce:duration-feedback"]));

    fireEvent.click(button);
    expect(classes()).toEqual(expect.arrayContaining(["duration-surface", "ease-productive-enter", "visible", "opacity-100"]));
    expect(classes().some((c) => c.startsWith("ease-expressive"))).toBe(false);
  });

  it("色・余白・角丸・文字は用途のトークン（任意の値を直書きしない）", () => {
    render(<InfoTip label={LABEL}>{TEXT}</InfoTip>);
    const button = trigger();
    const popover = popoverOf(button);
    expect(popover.className).toEqual(
      expect.stringContaining("rounded-control-sm border border-border bg-card p-inset")
    );
    expect(popover.className).toEqual(expect.stringContaining("text-role-help font-regular"));
    expect(popover.className).toContain("mt-related");
    // 任意の値（`-[…]`）に生の長さ・時間・色・曲線を書いていない
    // （幅の上限は画面の左右余白のトークンから作る。transition の対象プロパティ名は値ではない）
    const arbitrary = `${popover.className} ${button.className}`.match(/\S+-\[[^\]]*\]/g) ?? [];
    expect(arbitrary).toContain("max-w-[calc(100vw-2*var(--space-page-inline))]");
    for (const cls of arbitrary) {
      expect(cls).not.toMatch(/\d(px|ms|s|rem|em)\b|#[0-9a-f]{3,8}\b|rgba?\(|cubic-bezier/i);
    }
    expect(button.className).toContain("text-muted");
    fireEvent.click(button);
    expect(button.className).toContain("text-accent");
  });
});

// 中身は文字列だけ（ボタン・リンクを入れられない）ことを型で止めている。
// `pnpm typecheck` がこの行を検査する（@ts-expect-error が不要になったら = 型が緩んだら落ちる）。
export const _childrenMustBeText = (
  // @ts-expect-error — リンクは入れられない
  <InfoTip label={LABEL}><a href="/help">詳しく</a></InfoTip>
);

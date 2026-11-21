/**
 * Modal を枠（dialog-frame・BottomSheet と共有）に載せ替えたあとも、
 * **DOM と振る舞いが変わっていない**こと（#56）。
 *
 * peco の 33 箇所（うち position="bottom" 9 箇所）がこの DOM のまま動いている。
 * サーバー描画の文字列のバイト一致は verify.mjs の verify:modal が見る。ここは
 * クライアントで portal された DOM と、押す・Escape・Tab・閉じたら戻すを見る。
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Modal } from "../src/Modal";

afterEach(() => {
  cleanup();
});

describe("Modal — DOM は従来のまま", () => {
  it("center: 暗転面とカードのクラス・属性が従来と同じ（data-state も inert も出さない）", () => {
    render(
      <Modal open onClose={() => {}} ariaLabel="確認">
        X
      </Modal>
    );
    const card = screen.getByRole("dialog", { name: "確認" });
    expect(card.parentElement!.outerHTML).toBe(
      '<div class="fixed inset-0 z-50 flex bg-black/40 p-4 items-center justify-center">' +
        '<div role="dialog" aria-modal="true" aria-label="確認" tabindex="-1" class="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl outline-none ">X</div></div>'
    );
    expect(card.parentElement!.parentElement).toBe(document.body);
  });

  it("position=bottom: 中央のまま、高さ上限 + スクロールだけが付く（peco #681 のテストと同じ）", () => {
    render(
      <Modal open onClose={() => {}} ariaLabel="クイック作成" position="bottom">
        X
      </Modal>
    );
    const card = screen.getByRole("dialog");
    expect(card.parentElement!.className).toBe("fixed inset-0 z-50 flex bg-black/40 p-4 items-center justify-center");
    expect(card.className).toBe(
      "w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl outline-none max-h-[90vh] overflow-y-auto overscroll-contain"
    );
  });

  it("role=presentation の opt-out はフォーカスを奪わず、aria-modal も tabindex も出さない", () => {
    render(
      <>
        <button type="button">背後</button>
        <Modal open onClose={() => {}} role="presentation">
          X
        </Modal>
      </>
    );
    const card = screen.getByRole("presentation");
    expect(card.hasAttribute("aria-modal")).toBe(false);
    expect(card.hasAttribute("tabindex")).toBe(false);
    expect(document.activeElement).not.toBe(card);
  });
});

describe("Modal — 振る舞いは従来のまま", () => {
  function Demo({ onCloseSpy }: { onCloseSpy: () => void }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          削除する
        </button>
        <Modal
          open={open}
          onClose={() => {
            onCloseSpy();
            setOpen(false);
          }}
          ariaLabel="削除の確認"
        >
          <button type="button">キャンセル</button>
          <button type="button">削除</button>
        </Modal>
      </>
    );
  }

  it("開くとカードへフォーカス・Escape で閉じて呼び出し元へ戻る", () => {
    const onClose = vi.fn();
    render(<Demo onCloseSpy={onClose} />);
    const opener = screen.getByRole("button", { name: "削除する" });
    act(() => opener.focus());
    fireEvent.click(opener);
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("背景を押すと閉じ、カードの中を押しても閉じない", () => {
    const onClose = vi.fn();
    render(<Demo onCloseSpy={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Tab はカードの中で折り返す", () => {
    render(<Demo onCloseSpy={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    const first = screen.getByRole("button", { name: "キャンセル" });
    const last = screen.getByRole("button", { name: "削除" });
    fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(first);
  });
});

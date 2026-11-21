/**
 * Alert の押せる行（#56・peco 要件 27 §7 の入口）。
 *
 * - live region（error=alert / それ以外=status・#1165）は外側の箱に 1 つだけ。リンク / ボタンには付けない
 * - 行全体が 1 つのリンク / ボタンで、名前は本文（› は読み上げから外す）
 * - 押せない Alert の DOM は従来のまま（バイト単位の固定は verify.mjs の verify:alert）
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Alert, type AlertLinkComponent } from "../src/Alert";

afterEach(() => {
  cleanup();
});

const TEXT = "重複の可能性があるお客さまが 3 組います";
const HREF = "/provider/demo/customers/duplicates";

describe("Alert — 押せる行（href）", () => {
  it("外側の箱が status、その中に行全体のリンクが 1 つ。名前は本文", () => {
    render(
      <Alert type="warning" href={HREF}>
        {TEXT}
      </Alert>
    );
    const status = screen.getByRole("status");
    const link = screen.getByRole("link", { name: TEXT });
    expect(link.getAttribute("href")).toBe(HREF);
    expect(status.contains(link)).toBe(true);
    // live region はリンクに付けない（リンクであることが読み上げから消えるため）・入れ子にしない
    expect(link.getAttribute("role")).toBeNull();
    expect(document.querySelectorAll('[role="status"], [role="alert"]')).toHaveLength(1);
    // 行全体: リンクが箱の唯一の子
    expect(status.children).toHaveLength(1);
    expect(status.firstElementChild).toBe(link);
  });

  it("右端の › は読み上げから外し、16px で文字の後ろに置く", () => {
    render(
      <Alert type="warning" href={HREF}>
        {TEXT}
      </Alert>
    );
    const link = screen.getByRole("link");
    const svg = link.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("aria-hidden")).toBe("true");
    expect(svg!.getAttribute("width")).toBe("16");
    expect(link.lastElementChild).toBe(svg);
    expect(link.textContent).toBe(TEXT);
  });

  it("type=error では外側の箱が alert（割り込みで読む）", () => {
    render(
      <Alert type="error" href={HREF}>
        読み込みに失敗しました
      </Alert>
    );
    const alert = screen.getByRole("alert");
    expect(alert.contains(screen.getByRole("link", { name: "読み込みに失敗しました" }))).toBe(true);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("linkComponent（next/link の Link など）に href・クラス・中身を渡す", () => {
    const received: Array<{ href: string; className?: string }> = [];
    const FakeLink: AlertLinkComponent = ({ href, className, children }) => {
      received.push({ href, className });
      return (
        <a href={href} className={className} data-router-link="">
          {children}
        </a>
      );
    };
    render(
      <Alert type="warning" href={HREF} linkComponent={FakeLink}>
        {TEXT}
      </Alert>
    );
    const link = screen.getByRole("link", { name: TEXT });
    expect(link.hasAttribute("data-router-link")).toBe(true);
    expect(received.at(-1)?.href).toBe(HREF);
    expect(received.at(-1)?.className).toContain("w-full");
  });

  it("data-testid は外側の箱に付く（結果だけが描く目印・ADR-0011）", () => {
    render(
      <Alert type="success" href={HREF} data-testid="merge-result">
        2 組をまとめました
      </Alert>
    );
    expect(screen.getByTestId("merge-result").getAttribute("role")).toBe("status");
  });

  it("フォーカスの輪が見える・行の高さは押せない Alert と同じ余白", () => {
    render(
      <Alert type="warning" href={HREF}>
        {TEXT}
      </Alert>
    );
    const link = screen.getByRole("link");
    const status = screen.getByRole("status");
    expect(link.className).toContain("focus-visible:outline-accent");
    expect(link.className).toEqual(expect.stringContaining("px-4 py-3"));
    // 余白は中のリンクが持つ（箱が持つと、余白の部分が押せない）
    expect(status.className).not.toMatch(/\bp[xy]-/);
  });
});

describe("Alert — 押せる行（onClick）", () => {
  it("行全体が type=button のボタン。押すと onClick、名前は本文", () => {
    const onClick = vi.fn();
    render(
      <Alert type="warning" onClick={onClick}>
        {TEXT}
      </Alert>
    );
    const button = screen.getByRole("button", { name: TEXT });
    expect(button.getAttribute("type")).toBe("button");
    expect(screen.getByRole("status").firstElementChild).toBe(button);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("Alert — 押せない Alert は変わらない", () => {
  it("リンクもボタンも › も出さない", () => {
    const html = renderToStaticMarkup(<Alert type="warning">この操作は取り消せません</Alert>);
    expect(html).toBe(
      '<div role="status" class="rounded-xl px-4 py-3 text-sm bg-warning-bg text-warning">この操作は取り消せません</div>'
    );
  });
});

// 型で止めているもの（`pnpm typecheck` がこの行を検査する。@ts-expect-error が不要になったら = 型が緩んだら落ちる）
export const _pressableChildrenMustBeText = (
  // @ts-expect-error — 押せる行の中にリンク・ボタンを入れられない（入れ子の操作）
  <Alert type="warning" href={HREF}><a href="/x">確認する</a></Alert>
);
export const _hrefAndOnClickAreExclusive = (
  // @ts-expect-error — リンクとボタンを同時には持てない
  <Alert type="warning" href={HREF} onClick={() => {}}>{TEXT}</Alert>
);
export const _linkComponentNeedsHref = (
  // @ts-expect-error — linkComponent だけ渡しても押せる行にならない
  <Alert type="warning" linkComponent={(p: { href: string }) => <a href={p.href} />}>{TEXT}</Alert>
);

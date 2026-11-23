/**
 * タブの `variant="segmented"`（#60・2026-11-23 運用者裁定）の振る舞い。
 *
 * 既定（underline）の DOM が 1 バイトも変わらないことは `verify.mjs` の `verify:tabs` が
 * dist を描画して固定している。ここは **Context で見た目が届くこと・押すと切り替わること・
 * 読み上げの属性が下線型と同じこと**を見る。
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { TabFilter } from "../src/TabFilter";
import { TabBar, TabButton, TabList, tabItemClass } from "../src/Tabs";

afterEach(() => {
  cleanup();
});

function Switcher({
  variant,
  size,
  fullWidth,
}: {
  variant?: "underline" | "segmented";
  size?: "sm" | "md";
  fullWidth?: boolean;
}) {
  const [active, setActive] = useState<"customer" | "owner">("customer");
  return (
    <TabList label="立場" variant={variant} size={size} fullWidth={fullWidth}>
      <TabButton isActive={active === "customer"} label="お客さま" onClick={() => setActive("customer")} />
      <TabButton isActive={active === "owner"} label="事業主" onClick={() => setActive("owner")} />
    </TabList>
  );
}

describe("TabList variant=segmented — 読み上げの属性は下線型と同じ", () => {
  it("入れ物は role=tablist + aria-label、子は role=tab の button（type=button）", () => {
    render(<Switcher variant="segmented" />);
    const list = screen.getByRole("tablist", { name: "立場" });
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    for (const tab of tabs) {
      expect(tab.tagName).toBe("BUTTON");
      expect(tab.getAttribute("type")).toBe("button");
      expect(tab.parentElement).toBe(list);
    }
  });

  it("押すと aria-selected / aria-current が移る", () => {
    render(<Switcher variant="segmented" />);
    const customer = screen.getByRole("tab", { name: "お客さま" });
    const owner = screen.getByRole("tab", { name: "事業主" });
    expect(customer.getAttribute("aria-selected")).toBe("true");
    expect(customer.getAttribute("aria-current")).toBe("page");
    expect(owner.getAttribute("aria-selected")).toBe("false");
    expect(owner.hasAttribute("aria-current")).toBe(false);

    fireEvent.click(owner);
    expect(owner.getAttribute("aria-selected")).toBe("true");
    expect(owner.className).toContain("bg-accent text-on-accent");
    expect(customer.getAttribute("aria-selected")).toBe("false");
    expect(customer.className).not.toContain("bg-accent");
  });
});

describe("TabList variant=segmented — 見た目は Context で TabButton に届く", () => {
  it("TabButton に variant を渡さなくてもセグメント型になり、下線を描かない", () => {
    render(<Switcher variant="segmented" />);
    const list = screen.getByRole("tablist");
    expect(list.className).toContain("rounded-full");
    expect(list.className).toContain("inline-flex");
    expect(list.parentElement?.className ?? "").not.toContain("border-b");
    const active = screen.getByRole("tab", { name: "お客さま" });
    expect(active.className).toContain("rounded-full");
    expect(active.querySelector("span.absolute")).toBeNull();
  });

  it("size の既定は md（h-10 min-w-30）、sm は小さな帯", () => {
    const { unmount } = render(<Switcher variant="segmented" />);
    expect(screen.getByRole("tab", { name: "事業主" }).className).toContain("h-10 min-w-30");
    unmount();
    render(<Switcher variant="segmented" size="sm" />);
    const sm = screen.getByRole("tab", { name: "事業主" }).className;
    expect(sm).toContain("px-4 py-1");
    expect(sm).not.toContain("h-10");
  });

  it("fullWidth は枠を w-full にし、項目を flex-1 で等分する", () => {
    render(<Switcher variant="segmented" fullWidth />);
    expect(screen.getByRole("tablist").className).toContain("flex w-full");
    for (const tab of screen.getAllByRole("tab")) expect(tab.className).toContain("flex-1");
  });

  it("セグメント型の中に下線型を入れ子にしても、内側は下線型のまま", () => {
    render(
      <TabList variant="segmented" label="外">
        <TabButton isActive label="外側" onClick={() => {}} />
        <TabList label="内">
          <TabButton isActive label="内側" onClick={() => {}} />
        </TabList>
      </TabList>
    );
    expect(screen.getByRole("tab", { name: "外側" }).className).toContain("rounded-full");
    const inner = screen.getByRole("tab", { name: "内側" });
    expect(inner.className).not.toContain("rounded-full");
    expect(inner.querySelector("span.absolute")).not.toBeNull();
  });
});

describe("TabFilter / TabBar / tabItemClass", () => {
  it("TabFilter は variant をそのまま TabList に渡し、押すと onChange が呼ばれる", () => {
    const calls: string[] = [];
    render(
      <TabFilter
        variant="segmented"
        tabs={[
          { key: "customer", label: "お客さま" },
          { key: "owner", label: "事業主" },
        ]}
        activeKey="customer"
        onChange={(k) => calls.push(k)}
      />
    );
    expect(screen.getByRole("tablist").className).toContain("rounded-full");
    fireEvent.click(screen.getByRole("tab", { name: "事業主" }));
    expect(calls).toEqual(["owner"]);
  });

  it("TabBar（リンク版）の segmented は role を付けず、子は tabItemClass で同じ見た目を組める", () => {
    render(
      <TabBar variant="segmented">
        <a href="/try" aria-current="page" className={tabItemClass(true, "segmented")}>
          お客さま
        </a>
        <a href="/try?as=owner" className={tabItemClass(false, "segmented")}>
          事業主
        </a>
      </TabBar>
    );
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
    const current = screen.getByRole("link", { name: "お客さま" });
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.className).toContain("bg-accent text-on-accent");
    expect(current.parentElement?.className).toContain("rounded-full");
  });

  it("セグメント型のクラスに任意値（[…]）を書かない", () => {
    for (const isActive of [true, false])
      for (const size of ["sm", "md"] as const)
        for (const fullWidth of [true, false])
          expect(tabItemClass(isActive, "segmented", { size, fullWidth })).not.toMatch(/\[/);
  });
});

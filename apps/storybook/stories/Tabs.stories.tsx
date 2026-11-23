import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TabBar, TabButton, TabFilter, TabList, tabItemClass } from "@edgescrum/ds-core";

const meta = {
  title: "Components/Tabs",
  component: TabList,
} satisfies Meta<typeof TabList>;

export default meta;
type Story = StoryObj<typeof meta>;

function TabListDemo() {
  const [active, setActive] = useState("basic");
  const tabs = [
    { key: "basic", label: "基本情報" },
    { key: "appearance", label: "外観" },
    { key: "hours", label: "営業時間", count: 7 },
  ];
  return (
    <TabList label="店舗設定">
      {tabs.map((t) => (
        <TabButton
          key={t.key}
          label={t.label}
          count={t.count}
          isActive={active === t.key}
          onClick={() => setActive(t.key)}
        />
      ))}
    </TabList>
  );
}

export const TabListWithButtons: Story = {
  args: { children: null },
  render: () => <TabListDemo />,
};

function TabFilterDemo() {
  const [key, setKey] = useState<"all" | "unpaid" | "paid">("all");
  return (
    <TabFilter
      tabs={[
        { key: "all", label: "すべて", count: 24 },
        { key: "unpaid", label: "未払い", count: 3 },
        { key: "paid", label: "支払済み", count: 21 },
      ]}
      activeKey={key}
      onChange={setKey}
    />
  );
}

export const Filter: Story = {
  args: { children: null },
  render: () => <TabFilterDemo />,
};

// ── variant="segmented"（#60）────────────────────────────────────────────────
// 同じ中身の「見方・立場」を 2〜3 択で切り替えるときだけ使う。
// 中身そのものを切り替えるタブは上の下線型のまま（#893・Tabs.design.md）。

function SegmentedDemo({ size, fullWidth }: { size?: "sm" | "md"; fullWidth?: boolean }) {
  const [as, setAs] = useState<"customer" | "owner">("customer");
  return (
    <TabList label="体験する立場" variant="segmented" size={size} fullWidth={fullWidth}>
      <TabButton isActive={as === "customer"} label="お客さま" onClick={() => setAs("customer")} />
      <TabButton isActive={as === "owner"} label="事業主" onClick={() => setAs("owner")} />
    </TabList>
  );
}

/** 既定の大きさ（md・高さ 40px・幅 120px 以上）。URL を変えない切り替え */
export const Segmented: Story = {
  args: { children: null },
  render: () => <SegmentedDemo />,
};

/** sm: 1 行に他の操作と並べる小さな切り替え */
export const SegmentedSmall: Story = {
  args: { children: null },
  render: () => <SegmentedDemo size="sm" />,
};

/** fullWidth: スマホで横幅いっぱいにして等分する */
export const SegmentedFullWidth: Story = {
  args: { children: null },
  render: () => (
    <div className="max-w-sm">
      <SegmentedDemo fullWidth />
    </div>
  ),
};

/**
 * リンク版（URL が変わる切り替え）。子はアプリ側の `TabLink` を想定し、ここでは `<a>` で代用する。
 * role は付けず、現在地は `aria-current="page"`。見た目は `tabItemClass(isActive, "segmented")`。
 */
function SegmentedLinkDemo() {
  const [as, setAs] = useState<"customer" | "owner">("customer");
  const items = [
    { key: "customer", label: "お客さま", href: "?" },
    { key: "owner", label: "事業主", href: "?as=owner" },
  ] as const;
  return (
    <TabBar variant="segmented">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          aria-current={as === item.key ? "page" : undefined}
          className={tabItemClass(as === item.key, "segmented")}
          onClick={(e) => {
            e.preventDefault();
            setAs(item.key);
          }}
        >
          {item.label}
        </a>
      ))}
    </TabBar>
  );
}

export const SegmentedLinks: Story = {
  args: { children: null },
  render: () => <SegmentedLinkDemo />,
};

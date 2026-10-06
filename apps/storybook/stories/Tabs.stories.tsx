import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TabButton, TabFilter, TabList } from "@edgescrum/ds-core";

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

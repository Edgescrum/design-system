import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectDropdown } from "@edgescrum/peco-ui";

const OPTIONS = [
  { value: "cut", label: "カット（60 分）" },
  { value: "color", label: "カラー（90 分）" },
  { value: "perm", label: "パーマ（120 分）" },
];

const meta = {
  title: "Components/SelectDropdown",
  component: SelectDropdown,
} satisfies Meta<typeof SelectDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo(props: { size?: "sm" | "md"; clearable?: boolean; disabled?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <div className="w-72">
      <SelectDropdown
        options={OPTIONS}
        value={value}
        onChange={setValue}
        placeholder="メニューを選択"
        ariaLabel="サービスメニュー"
        {...props}
      />
    </div>
  );
}

export const Playground: Story = {
  args: { options: OPTIONS, value: "", onChange: () => {} },
  render: () => <Demo />,
};

export const Clearable: Story = {
  args: { options: OPTIONS, value: "", onChange: () => {} },
  render: () => <Demo clearable />,
};

export const Small: Story = {
  args: { options: OPTIONS, value: "", onChange: () => {} },
  render: () => <Demo size="sm" />,
};

export const Disabled: Story = {
  args: { options: OPTIONS, value: "", onChange: () => {} },
  render: () => <Demo disabled />,
};

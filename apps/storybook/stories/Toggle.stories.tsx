import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toggle } from "@edgescrum/ds-core";

const meta = {
  title: "Components/Toggle",
  component: Toggle,
  args: {
    checked: true,
    onChange: () => {},
    ariaLabel: "予約受付",
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulToggle(props: { activeColor?: string; ariaLabel?: string; initial?: boolean }) {
  const [checked, setChecked] = useState(props.initial ?? true);
  return (
    <Toggle
      checked={checked}
      onChange={setChecked}
      activeColor={props.activeColor}
      ariaLabel={props.ariaLabel}
    />
  );
}

export const Playground: Story = {
  render: (args) => <StatefulToggle ariaLabel={args.ariaLabel} />,
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <StatefulToggle initial ariaLabel="オン" />
        <span className="text-sm text-muted">オン（既定色 bg-success）</span>
      </div>
      <div className="flex items-center gap-3">
        <StatefulToggle initial={false} ariaLabel="オフ" />
        <span className="text-sm text-muted">オフ</span>
      </div>
      <div className="flex items-center gap-3">
        <StatefulToggle initial activeColor="bg-accent" ariaLabel="アクセント色" />
        <span className="text-sm text-muted">activeColor=&quot;bg-accent&quot;</span>
      </div>
    </div>
  ),
};

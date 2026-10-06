import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormLabel, NumberField } from "@edgescrum/ds-core";

const meta = {
  title: "Components/NumberField",
  component: NumberField,
  args: {
    value: "60",
    onValueChange: () => {},
    placeholder: "60",
  },
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulNumberField(props: { initial?: string; placeholder?: string; id?: string }) {
  const [value, setValue] = useState(props.initial ?? "");
  return (
    <NumberField
      id={props.id}
      value={value}
      onValueChange={setValue}
      placeholder={props.placeholder}
    />
  );
}

export const Playground: Story = {
  render: (args) => (
    <div className="w-40">
      <StatefulNumberField initial={args.value} placeholder={args.placeholder} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-40">
      <FormLabel htmlFor="nf-duration" required>
        所要時間（分）
      </FormLabel>
      <StatefulNumberField id="nf-duration" initial="60" placeholder="60" />
      <p className="mt-1.5 text-xs text-muted">
        type=&quot;text&quot; + inputMode=&quot;numeric&quot;。空にしてから打ち直せる
      </p>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="w-40">
      <StatefulNumberField placeholder="定員" />
    </div>
  ),
};

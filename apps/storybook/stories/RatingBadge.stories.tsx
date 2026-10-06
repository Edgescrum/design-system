import type { Meta, StoryObj } from "@storybook/react-vite";
import { RatingBadge } from "@edgescrum/ds-core";

const meta = {
  title: "Components/RatingBadge",
  component: RatingBadge,
  args: { label: "接客", value: 4 },
  argTypes: {
    value: { control: { type: "number", min: 0, max: 6, step: 1 } },
  },
} satisfies Meta<typeof RatingBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * 1〜5 の段。**隣り合う段が見分けられること**がこのスケールの要件で、
 * positive / warning / danger の 3 色に潰せないのはこのため。
 */
export const Scale: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((v) => (
        <RatingBadge key={v} label="接客" value={v} />
      ))}
    </div>
  ),
};

/**
 * 1〜5 以外は無彩色で描く。**データ不整合を黙って「良い色」にしない**ための退避先で、
 * 画面にこれが出たら値のほうがおかしい。
 */
export const OutOfRange: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <RatingBadge label="範囲外" value={0} />
      <RatingBadge label="範囲外" value={6} />
      <RatingBadge label="小数" value={3.5} />
    </div>
  ),
};

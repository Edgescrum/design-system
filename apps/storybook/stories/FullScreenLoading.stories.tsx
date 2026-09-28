import type { Meta, StoryObj } from "@storybook/react-vite";
import { FullScreenLoading } from "@edgescrum/peco-ui";

const meta = {
  title: "Components/FullScreenLoading",
  component: FullScreenLoading,
  args: { message: "読み込み中..." },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof FullScreenLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const CustomMessage: Story = {
  args: { message: "予約情報を確認しています..." },
};

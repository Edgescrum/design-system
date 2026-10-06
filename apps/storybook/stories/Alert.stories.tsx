import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "@edgescrum/ds-core";

const TYPES = ["error", "success", "warning"] as const;

const meta = {
  title: "Components/Alert",
  component: Alert,
  args: { type: "error", children: "登録に失敗しました" },
  argTypes: {
    type: { control: "inline-radio", options: TYPES },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllTypes: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Alert type="error">登録に失敗しました</Alert>
      <Alert type="success">予約を確定しました</Alert>
      <Alert type="warning">この操作は取り消せません</Alert>
    </div>
  ),
};

export const WithTestId: Story = {
  args: {
    type: "success",
    children: "保存しました",
    "data-testid": "save-result",
  },
};

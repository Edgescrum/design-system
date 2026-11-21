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

/**
 * 押せる行（#56・peco 要件 27 §7 の入口）。行全体が 1 つのリンクで、右端に ›。
 * live region（status）は外側の箱のまま、リンクの名前は本文。
 * peco では `linkComponent={Link}`（next/link）を渡す。中身は文字列だけ。
 */
export const PressableLink: Story = {
  args: {
    type: "warning",
    href: "#duplicates",
    children: "重複の可能性があるお客さまが 3 組います",
  },
  render: (args) => (
    <div className="w-[358px]">
      <Alert {...args} />
    </div>
  ),
};

/** 押してその場でシートを開くときは `onClick`（行全体が type="button" のボタン）。 */
export const PressableButton: Story = {
  args: {
    type: "warning",
    onClick: () => {},
    children: "重複の可能性があるお客さまが 3 組います",
  },
  render: (args) => (
    <div className="w-[358px]">
      <Alert {...args} />
    </div>
  ),
};

/** 押せる行と押せない Alert を並べたとき、文字の位置は揃う（余白は同じ）。 */
export const PressableNextToPlain: Story = {
  render: () => (
    <div className="flex w-[358px] flex-col gap-related">
      <Alert type="warning" href="#duplicates">
        重複の可能性があるお客さまが 3 組います
      </Alert>
      <Alert type="warning">この操作は取り消せません</Alert>
      <Alert type="error" href="#retry">
        読み込みに失敗しました
      </Alert>
    </div>
  ),
};

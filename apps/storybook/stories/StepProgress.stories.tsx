import type { Meta, StoryObj } from "@storybook/react-vite";
import { StepProgress } from "@edgescrum/peco-ui";

const meta = {
  title: "Components/StepProgress",
  component: StepProgress,
  args: {
    current: 2,
    total: 4,
    label: "日時",
    stepNames: ["メニュー", "日時", "お客様情報", "確認"],
  },
  argTypes: {
    current: { control: { type: "number", min: 1 } },
    total: { control: { type: "number", min: 1 } },
  },
} satisfies Meta<typeof StepProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="w-80">
      <StepProgress {...args} />
    </div>
  ),
};

export const WithoutLabel: Story = {
  // 事業主の初回登録と同じ「ステップ N / M」だけの表示
  args: { current: 1, total: 4, label: undefined, stepNames: undefined },
  render: (args) => (
    <div className="w-80">
      <StepProgress {...args} />
    </div>
  ),
};

export const AllSteps: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      {[1, 2, 3, 4].map((current) => (
        <StepProgress
          key={current}
          current={current}
          total={4}
          label={["メニュー", "日時", "お客様情報", "確認"][current - 1]}
          stepNames={["メニュー", "日時", "お客様情報", "確認"]}
        />
      ))}
    </div>
  ),
};

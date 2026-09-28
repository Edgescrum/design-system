import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "@edgescrum/peco-ui";

const SIZES = ["sm", "md", "lg"] as const;

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  args: { size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: SIZES },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      {SIZES.map((size) => (
        <div key={size} className="flex items-center gap-2">
          <Spinner size={size} />
          <code className="text-xs text-muted">{size}</code>
        </div>
      ))}
    </div>
  ),
};

export const WithText: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Spinner size="md" />
      <p className="text-sm text-muted">読み込み中...</p>
    </div>
  ),
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, type ButtonSize, type ButtonVariant } from "@edgescrum/peco-ui";

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "soft",
  "outline",
  "ghost",
  "danger",
  "success",
  "inverse",
];
const SIZES: ButtonSize[] = ["sm", "md", "lg"];

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "予約を確定する", variant: "primary", size: "md" },
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    size: { control: "inline-radio", options: SIZES },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex items-center gap-4">
          <code className="w-24 text-xs text-muted">{variant}</code>
          {SIZES.map((size) => (
            <Button key={size} variant={variant} size={size}>
              予約する
            </Button>
          ))}
          <Button variant={variant} disabled>
            無効
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const FullWidth: Story = {
  args: { fullWidth: true, size: "lg" },
  render: (args) => (
    <div className="w-80">
      <Button {...args} />
    </div>
  ),
};

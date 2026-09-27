import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, type BadgeTone, type BadgeVariant } from "@edgescrum/peco-ui";

const TONES: BadgeTone[] = ["neutral", "accent", "danger", "warning", "positive", "info"];
const VARIANTS: BadgeVariant[] = ["solid", "soft", "outline"];

const meta = {
  title: "Components/Badge",
  component: Badge,
  args: { children: "支払い待ち", tone: "warning", variant: "soft", size: "md" },
  argTypes: {
    tone: { control: "select", options: TONES },
    variant: { control: "inline-radio", options: VARIANTS },
    size: { control: "inline-radio", options: ["sm", "md"] },
    withDot: { control: "boolean" },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Matrix: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {TONES.map((tone) => (
        <div key={tone} className="flex items-center gap-3">
          <code className="w-20 text-xs text-muted">{tone}</code>
          {VARIANTS.map((variant) => (
            <Badge key={variant} tone={tone} variant={variant}>
              {variant}
            </Badge>
          ))}
          <Badge tone={tone} withDot>
            ドット付き
          </Badge>
          <Badge tone={tone} size="sm">
            sm
          </Badge>
        </div>
      ))}
    </div>
  ),
};

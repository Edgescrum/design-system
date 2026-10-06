import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormInput, FormLabel, FormTextarea } from "@edgescrum/ds-core";

const meta = {
  title: "Components/FormField",
  component: FormInput,
  args: { placeholder: "山田 花子" },
} satisfies Meta<typeof FormInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="w-80">
      <FormInput {...args} />
    </div>
  ),
};

export const LabelAndInput: Story = {
  render: () => (
    <div className="w-80">
      <FormLabel htmlFor="ff-name" required>
        お名前
      </FormLabel>
      <FormInput id="ff-name" placeholder="山田 花子" />
    </div>
  ),
};

export const Textarea: Story = {
  render: () => (
    <div className="w-80">
      <FormLabel htmlFor="ff-note">メモ</FormLabel>
      <FormTextarea id="ff-note" rows={4} placeholder="ご要望があればご記入ください" />
    </div>
  ),
};

export const GroupLabel: Story = {
  render: () => (
    <div className="w-80">
      {/* 選択肢ボタンが複数並ぶときは htmlFor ではなく id + aria-labelledby で紐付ける */}
      <FormLabel id="ff-contact-label">連絡方法</FormLabel>
      <div role="radiogroup" aria-labelledby="ff-contact-label" className="flex gap-2">
        <button
          type="button"
          role="radio"
          aria-checked="true"
          className="rounded-xl border border-accent bg-accent-bg px-4 py-2 text-sm font-semibold text-accent-dark"
        >
          LINE
        </button>
        <button
          type="button"
          role="radio"
          aria-checked="false"
          className="rounded-xl border border-border bg-card px-4 py-2 text-sm"
        >
          電話
        </button>
      </div>
    </div>
  ),
};

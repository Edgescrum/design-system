import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageContainer } from "@edgescrum/ds-core";

const meta = {
  title: "Components/PageContainer",
  component: PageContainer,
  args: { children: null },
  parameters: {
    // sm 未満の max-w-lg + 中央寄せが見えるよう、Canvas をページ幅いっぱいで使う
    layout: "fullscreen",
  },
} satisfies Meta<typeof PageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="bg-background p-4">
      <PageContainer>
        <div className="rounded-xl border border-dashed border-accent bg-card p-6 text-sm text-muted">
          sm 未満では max-w-lg(512px) で中央寄せ、sm 以上では親（layout）の幅に従う。
          ビューポート幅を変えて確認できます。
        </div>
      </PageContainer>
    </div>
  ),
};

export const WithSpacingClass: Story = {
  render: () => (
    <div className="bg-background p-4">
      <PageContainer className="space-y-4">
        <div className="rounded-xl bg-card p-4 text-sm">セクション 1</div>
        <div className="rounded-xl bg-card p-4 text-sm">セクション 2</div>
        <div className="rounded-xl bg-card p-4 text-sm">セクション 3</div>
      </PageContainer>
    </div>
  ),
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppBar, PageBody, PageTabBar, TabUnderline, tabItemClass } from "@edgescrum/ds-core";

/**
 * `PageBody` は **`<main>` と本文の余白の唯一の持ち主**（ADR 0027）。
 * 余白は `space.page.*`（sm 未満 24 / 16px・sm 以上 32 / 32px）で、ページからは変えられない。
 *
 * 余白が見えるように、本文の中身には点線の枠を付けてある（枠の外側 = PageBody の余白）。
 */
function Content({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-border bg-card p-4">
      <h2 className="text-base font-semibold">本文の先頭</h2>
      {Array.from({ length: lines }, (_, i) => (
        <p key={i} className="text-sm text-muted">
          本文の中身のレイアウト（grid・gap）は PageBody の子が持つ。PageBody は余白と幅だけを持つ。
        </p>
      ))}
    </div>
  );
}

const meta = {
  title: "Layout/PageBody",
  component: PageBody,
  args: {
    width: "none",
    fill: false,
    children: <Content />,
  },
  argTypes: {
    width: { control: "inline-radio", options: ["none", "admin", "narrow", "flow", "wide", "lp"] },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageBody>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** AppBar と同じ `width` を渡すと、戻るボタンの左端と本文の左端が揃う。 */
export const WithAppBar: Story = {
  args: { width: "flow" },
  render: (args) => (
    <div className="min-h-screen bg-background">
      <AppBar
        width={args.width}
        title="予約内容の確認"
        back={
          <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-border text-2xs text-muted">
            ←
          </span>
        }
      />
      <PageBody {...args} />
    </div>
  ),
};

/**
 * `PageTabBar placement="in-body"` は **PageBody の中の先頭**に置き、自分の下の余白
 * （16 / 24px）を自分で持つ。ページは `pt-*` を書かない（ADR 0027 Decision 6）。
 */
export const WithTabBarInBody: Story = {
  render: (args) => (
    <PageBody {...args}>
      <PageTabBar placement="in-body">
        {["基本情報", "外観", "営業時間"].map((label, i) => (
          <a key={label} href="#" className={tabItemClass(i === 0)} aria-current={i === 0 ? "page" : undefined}>
            {label}
            {i === 0 && <TabUnderline />}
          </a>
        ))}
      </PageTabBar>
      <Content />
    </PageBody>
  ),
};

/** `data-*` は `<main>` に通る（peco は `data-page-full` で親 layout に全幅を宣言する）。 */
export const DataAttributes: Story = {
  args: { "data-page-full": true },
};

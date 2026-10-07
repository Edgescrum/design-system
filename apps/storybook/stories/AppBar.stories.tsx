import type { Meta, StoryObj } from "@storybook/react-vite";
import { APP_BAR_BACK_CLASS, AppBar, ChevronLeftIcon } from "@edgescrum/ds-core";

/**
 * 画面上部の sticky ヘッダー（ADR 0027）。
 *
 * ★ **戻るは DS が描かない。** DS は `next/link` を import できず、peco の戻るは履歴設計
 *   （`useSmartBack`）とも結合しているので、プロダクトが `APP_BAR_BACK_CLASS` を付けた
 *   リンクを `back` に渡す。ここではただの `<a>` で代用している。
 */
function BackLink() {
  return (
    <a href="#" className={APP_BAR_BACK_CLASS} aria-label="戻る">
      <ChevronLeftIcon />
    </a>
  );
}

/** ブランドマークは DS が持たない（ADR 0026）。どのブランドでもないプレースホルダ。 */
function PlaceholderMark() {
  return (
    <div
      aria-label="ブランドマーク（プレースホルダ）"
      role="img"
      className="flex h-5 w-20 items-center justify-center rounded-md border border-dashed border-border text-3xs text-muted sm:h-6"
    >
      your logo
    </div>
  );
}

const meta = {
  title: "Layout/AppBar",
  component: AppBar,
  args: {
    title: "予約内容の確認",
    width: "flow",
    back: <BackLink />,
  },
  argTypes: {
    width: { control: "inline-radio", options: ["none", "admin", "narrow", "flow", "wide", "lp"] },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithRightSlot: Story = {
  args: {
    title: "口コミ",
    width: "wide",
    right: <span className="text-xs text-muted">24 件</span>,
  },
};

/** 規約・問い合わせなど、画面名の代わりにロゴを出す形。 */
export const WithLogo: Story = {
  render: () => (
    <AppBar
      width="narrow"
      logo={<PlaceholderMark />}
      right={<span className="text-xs text-muted">右スロット</span>}
    />
  ),
};

/** 戻る先が無い起点の画面（戻る矢印なし）。 */
export const TitleOnly: Story = {
  args: { back: undefined, title: "アンケート" },
};

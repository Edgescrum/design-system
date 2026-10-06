import type { Meta, StoryObj } from "@storybook/react-vite";
import { FullScreenLoading } from "@edgescrum/peco-ui";

/**
 * ★ ブランドマークは **DS が持たない**（ADR 0026 / 2026-10-06）。
 *   以前この部品は `PecoLogo` を直描きしていたが、それは共通層に
 *   プロダクト #1 のブランドが焼き付いた状態だった。
 *
 *   このカタログは特定のプロダクトのものではないので、**どのブランドでもない
 *   プレースホルダ**を渡す。実際の呼び出しでは product 層のマークを渡すこと。
 */
function PlaceholderMark() {
  return (
    <div
      aria-label="ブランドマーク（プレースホルダ）"
      role="img"
      className="mx-auto flex h-10 w-28 items-center justify-center rounded-md border border-dashed border-border text-2xs text-muted"
    >
      your logo
    </div>
  );
}

const meta = {
  title: "Components/FullScreenLoading",
  component: FullScreenLoading,
  args: {
    message: "読み込み中...",
    logo: <PlaceholderMark />,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof FullScreenLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const CustomMessage: Story = {
  args: { message: "予約情報を確認しています..." },
};

/**
 * マークを出さないプロダクト向け。**`logo` は必須**なので、
 * 省略ではなく `null` を明示的に渡す（渡し忘れを型エラーにするための設計）。
 */
export const WithoutLogo: Story = {
  args: { logo: null },
};

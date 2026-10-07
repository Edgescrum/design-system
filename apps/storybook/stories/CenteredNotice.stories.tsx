import type { Meta, StoryObj } from "@storybook/react-vite";
import { CenteredNotice, buttonClass } from "@edgescrum/ds-core";

/**
 * 行き止まりの状態表示（ADR 0027）。決済・Stripe からの戻り / 認証エラー / 非公開店舗 / 404。
 *
 * ★ 最小の高さは `className` で**プロダクトが**渡す（peco は `min-h-app`）。画面の高さの
 *   定義（LIFF の viewport 補正・デモ環境バナー）がプロダクト固有なので DS は決めない。
 *   ここでは `min-h-screen` を渡している。
 */
function WarningIcon() {
  return (
    <div aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-bg text-warning">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path
          fillRule="evenodd"
          d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.9375.9375 0 1 0 0-1.875.9375.9375 0 0 0 0 1.875Z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

const meta = {
  title: "Layout/CenteredNotice",
  component: CenteredNotice,
  args: {
    title: "お支払い手続きが完了しました",
    description: "お支払いの確認が取れ次第、LINE でお知らせします。",
    note: "このページは閉じて構いません。",
    className: "min-h-screen",
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CenteredNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 決済・Stripe からの戻り（操作なし）。 */
export const Playground: Story = {};

/** 認証エラー（アイコン + 操作 + エラーコード）。 */
export const WithIconAndActions: Story = {
  args: {
    title: "このリンクは有効期限が切れています",
    description: "リンクは発行から 30 日で無効になります。事業主に新しいリンクの発行を依頼してください。",
    note: "エラーコード: expired_token",
    icon: <WarningIcon />,
    actions: (
      <>
        <a href="#" className={buttonClass({ variant: "primary", size: "md" })}>
          そのまま予約を続ける
        </a>
        <a href="#" className={buttonClass({ variant: "secondary", size: "md" })}>
          事業主を探す
        </a>
      </>
    ),
  },
};

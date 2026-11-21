import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, InfoTip, Modal, SheetActions, Toggle } from "@edgescrum/ds-core";

const meta = {
  title: "Components/InfoTip",
  component: InfoTip,
  args: {
    label: "予約のたびにすぐ通知する",
    children:
      "自分やスタッフが入れた予約・変更は届きません。オンにすると、毎朝のまとめから今日の予定を外します。",
  },
} satisfies Meta<typeof InfoTip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ラベル + i マーク + Toggle の 1 行（peco の予約設定「予約の通知」と同じ並び）。 */
function SettingRow({ label, description }: { label: string; description: string }) {
  const [checked, setChecked] = useState(true);
  return (
    <div className="flex items-center justify-between gap-related">
      <div className="flex min-w-0 items-center gap-related">
        <span className="text-role-body">{label}</span>
        <InfoTip label={label}>{description}</InfoTip>
      </div>
      <Toggle checked={checked} onChange={setChecked} ariaLabel={label} />
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-sm">
      <SettingRow label={args.label} description={args.children} />
    </div>
  ),
};

/**
 * 最初の利用先（peco 予約設定の「予約の通知」カード・Figma Screen 432:1547）。
 * 補足 1 文は画面に出し、入らない例外・副作用だけを i マークに入れる。
 * 画面幅が狭いと、ポップアップは画面の左右の余白（space.page.inline）の内側に収まる。
 */
export const InCard: Story = {
  render: () => (
    <div className="max-w-sm rounded-surface border border-border bg-card p-inset">
      <h2 className="text-role-heading font-emphasis">予約の通知</h2>
      <p className="mt-related text-role-help text-muted">オフのときは毎朝 8 時ごろにまとめて届けます</p>
      <div className="mt-group">
        <SettingRow
          label="予約のたびにすぐ通知する"
          description="お客さまが予約・キャンセル・日時の変更をするたびに LINE でお知らせします。スタッフが代わりに操作したときは届きません。オンにすると、毎朝のまとめは担当が未定の予約があるときだけ届きます。"
        />
      </div>
    </div>
  ),
};

/** 見出しの横に置く。右端の近くでも画面の外へはみ出さない。 */
export const NextToHeading: Story = {
  render: () => (
    <div className="flex items-center justify-end gap-related">
      <h2 className="text-role-heading font-emphasis">スケジュールの間隔</h2>
      <InfoTip label="スケジュールの間隔">
        予約の前後に空ける準備時間は、受付の締切も兼ねます。
      </InfoTip>
    </div>
  ),
};

/** 同時に開くのは 1 つ。片方を開いたまま、もう片方を押すと前のものが閉じる。 */
export const OneAtATime: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-group">
      <SettingRow label="当日予約を受け付ける" description="今日の空き枠をお客さまが予約できます。" />
      <SettingRow
        label="予約のたびにすぐ通知する"
        description="自分やスタッフが入れた予約・変更は届きません。"
      />
    </div>
  ),
};

/**
 * Modal の中。Esc を押すと **InfoTip だけ**が閉じ、もう一度押すと Modal が閉じる
 * （InfoTip は capture で Esc を拾って preventDefault し、Modal は defaultPrevented を見て降りる）。
 */
export const InModal: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>モーダルを開く</Button>
          <Modal open={open} onClose={() => setOpen(false)} ariaLabel="通知の設定">
            <h2 className="text-role-heading font-emphasis">通知の設定</h2>
            <div className="mt-group">
              <SettingRow
                label="予約のたびにすぐ通知する"
                description="自分やスタッフが入れた予約・変更は届きません。"
              />
            </div>
            <SheetActions>
              <Button variant="secondary" fullWidth onClick={() => setOpen(false)}>
                閉じる
              </Button>
            </SheetActions>
          </Modal>
        </>
      );
    }
    return <Demo />;
  },
};

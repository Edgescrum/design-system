import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BottomSheet, Button, InfoTip, Modal, SheetActions } from "@edgescrum/ds-core";

const meta = {
  title: "Components/BottomSheet",
  component: BottomSheet,
  args: { open: false, onClose: () => {}, title: "2 組をまとめます", children: null },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** シートの後ろに見える画面（開く前後でフォーカスが戻る先のボタンを含む） */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-page-inline py-page-block">
      <p className="text-role-help text-muted">同じお客さまかもしれない組を選んでまとめます</p>
      <div className="mt-group">{children}</div>
    </div>
  );
}

/**
 * ③ 確認のシート（Figma Screen 418:267）。「戻る」と「まとめる」の 2 つ。
 * 取り消せない注意は確定ボタンの直前に 1 文（§10-10）。Escape・背景タップ・「戻る」で閉じる。
 */
function ConfirmDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Page>
      <Button size="lg" fullWidth onClick={() => setOpen(true)}>
        選んだ 2 組をまとめる
      </Button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="2 組をまとめます">
        <p className="text-role-body text-foreground">
          仮登録の予約・請求・メモを、LINE 登録済みのお客さまに移します
        </p>
        <p className="text-role-help text-warning">まとめた内容は元に戻せません</p>
        <SheetActions className="flex gap-related">
          <Button variant="secondary" size="lg" fullWidth onClick={() => setOpen(false)}>
            戻る
          </Button>
          <Button size="lg" fullWidth onClick={() => setOpen(false)}>
            まとめる
          </Button>
        </SheetActions>
      </BottomSheet>
    </Page>
  );
}

export const Confirm: Story = {
  render: () => <ConfirmDemo />,
};

/**
 * 送信中は閉じない（Modal と同じ約束: `onClose` に何もしない関数を渡す）。
 * 「まとめる」を押すと 3 秒間、Escape・背景タップ・「戻る」が効かない。
 */
function SubmittingDemo() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const close = () => setOpen(false);
  const submit = () => {
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setOpen(false);
    }, 3000);
  };
  return (
    <Page>
      <Button size="lg" fullWidth onClick={() => setOpen(true)}>
        選んだ 2 組をまとめる
      </Button>
      <BottomSheet open={open} onClose={submitting ? () => {} : close} title="2 組をまとめます">
        <p className="text-role-body text-foreground">
          仮登録の予約・請求・メモを、LINE 登録済みのお客さまに移します
        </p>
        <p className="text-role-help text-warning">まとめた内容は元に戻せません</p>
        <SheetActions className="flex gap-related">
          <Button variant="secondary" size="lg" fullWidth disabled={submitting} onClick={close}>
            戻る
          </Button>
          <Button size="lg" fullWidth disabled={submitting} onClick={submit}>
            {submitting ? "まとめています" : "まとめる"}
          </Button>
        </SheetActions>
      </BottomSheet>
    </Page>
  );
}

export const Submitting: Story = {
  render: () => <SubmittingDemo />,
};

/**
 * ⑥ 組の詳細（Figma Screen 418:331）。比較の 2 列は peco の画面側でトークンから組む（DS の部品にしない）。
 * 閉じる + その組への操作 1 つ。見出しの横に InfoTip を置くと、Esc はまず InfoTip だけを閉じる。
 */
function DetailDemo() {
  const [open, setOpen] = useState(false);
  const column = (label: string, lines: string[]) => (
    <div className="flex min-w-0 flex-1 flex-col gap-related rounded-control bg-background p-inset text-role-help">
      <p className="font-emphasis text-muted">{label}</p>
      {lines.map((line) => (
        <p key={line} className="text-foreground">
          {line}
        </p>
      ))}
    </div>
  );
  return (
    <Page>
      <Button variant="secondary" fullWidth onClick={() => setOpen(true)}>
        山田 花子 ⇄ 山田 花子 の詳細
      </Button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="山田 花子 ⇄ 山田 花子">
        <div className="flex gap-related">
          {column("仮登録", ["電話 090-1234-5678", "予約 2件", "メモ「カラー剤アレルギーあり」"])}
          {column("LINE 登録済み", ["LINE 名 はなこ", "予約 8件・最終来店 10/28", "メモ「ショート希望」"])}
        </div>
        <div className="flex items-center gap-related">
          <p className="text-role-help text-muted">メモは両方残ります</p>
          <InfoTip label="メモは両方残ります">既存のメモの後ろに、仮登録のときのメモを足します。</InfoTip>
        </div>
        <Button variant="secondary" size="lg" fullWidth onClick={() => setOpen(false)}>
          閉じる
        </Button>
        <Button variant="ghost" fullWidth onClick={() => setOpen(false)}>
          別のお客さまとして残す
        </Button>
      </BottomSheet>
    </Page>
  );
}

export const Detail: Story = {
  render: () => <DetailDemo />,
};

/**
 * 中身が高いとき: 画面の 9 割で止まり、シートの中だけがスクロールする。
 * 操作行は SheetActions でシートの下端に残る。
 */
function LongContentDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Page>
      <Button size="lg" fullWidth onClick={() => setOpen(true)}>
        候補を見る
      </Button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="残す予約を選ぶ">
        {Array.from({ length: 24 }).map((_, i) => (
          <p key={i} className="text-role-body text-foreground">
            11/{1 + i} 10:00 朝ヨガ
          </p>
        ))}
        <SheetActions>
          <Button size="lg" fullWidth onClick={() => setOpen(false)}>
            この予約を残す
          </Button>
        </SheetActions>
      </BottomSheet>
    </Page>
  );
}

export const LongContent: Story = {
  render: () => <LongContentDemo />,
};

/**
 * 比べる用: `Modal position="bottom"` は**中央に出る**（下位互換・peco の 9 箇所がこの見た目）。
 * 下から出す面が要るときだけ BottomSheet を使う。
 */
function VersusModalPositionBottomDemo() {
  const [sheet, setSheet] = useState(false);
  const [modal, setModal] = useState(false);
  return (
    <Page>
      <div className="flex flex-col gap-related">
        <Button fullWidth onClick={() => setSheet(true)}>
          BottomSheet を開く
        </Button>
        <Button variant="secondary" fullWidth onClick={() => setModal(true)}>
          Modal position=&quot;bottom&quot; を開く
        </Button>
      </div>
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="下から出る">
        <p className="text-role-body">画面の下端から出て、下へ戻ります。</p>
        <Button variant="secondary" size="lg" fullWidth onClick={() => setSheet(false)}>
          閉じる
        </Button>
      </BottomSheet>
      <Modal open={modal} onClose={() => setModal(false)} ariaLabel="中央に出る" position="bottom">
        <p className="text-role-body">position=&quot;bottom&quot; でも中央に出ます。</p>
        <SheetActions className="mt-5">
          <Button variant="secondary" fullWidth onClick={() => setModal(false)}>
            閉じる
          </Button>
        </SheetActions>
      </Modal>
    </Page>
  );
}

export const VersusModalPositionBottom: Story = {
  render: () => <VersusModalPositionBottomDemo />,
};

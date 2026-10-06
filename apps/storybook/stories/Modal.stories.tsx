import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Modal, SheetActions } from "@edgescrum/ds-core";

const meta = {
  title: "Components/Modal",
  component: Modal,
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

function DemoModal({ position }: { position?: "center" | "bottom" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>モーダルを開く</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="スタッフを追加"
        position={position}
      >
        <h2 className="text-lg font-bold">スタッフを追加</h2>
        <p className="mt-2 text-sm text-muted">
          Escape で閉じる・Tab はカード内で折り返す・閉じると呼び出し元へフォーカスが戻る
          （dialog-behavior の実装）。
        </p>
        <SheetActions>
          <Button variant="secondary" fullWidth onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button fullWidth onClick={() => setOpen(false)}>
            追加する
          </Button>
        </SheetActions>
      </Modal>
    </>
  );
}

export const Center: Story = {
  args: { open: false, onClose: () => {}, ariaLabel: "デモ", children: null },
  render: () => <DemoModal />,
};

export const BottomSheet: Story = {
  args: { open: false, onClose: () => {}, ariaLabel: "デモ", children: null },
  render: () => <DemoModal position="bottom" />,
};

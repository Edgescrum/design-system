import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, SheetActions, sheetActionsClass } from "@edgescrum/ds-core";

const meta = {
  title: "Components/SheetActions",
  component: SheetActions,
  args: { children: null },
} satisfies Meta<typeof SheetActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * モーダル / シートの操作行をスクロール領域の下端に貼り付ける。
 * カードの高さを絞ってあるので、スクロールしても操作行が下端に残ることを確認できる。
 */
export const Playground: Story = {
  render: () => (
    <div className="max-h-80 w-80 overflow-y-auto rounded-xl bg-card p-5 shadow-lg">
      <h2 className="text-base font-bold">スタッフを追加</h2>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="mt-4">
          <label className="mb-1.5 block text-sm font-medium">項目 {i + 1}</label>
          <input className="w-full rounded-xl border border-border bg-card px-4 py-3" />
        </div>
      ))}
      <SheetActions className="mt-5 flex gap-2">
        <Button variant="secondary" fullWidth>
          キャンセル
        </Button>
        <Button fullWidth>作成する</Button>
      </SheetActions>
    </div>
  ),
};

export const SurfaceBackground: Story = {
  render: () => (
    <div className="max-h-80 w-80 overflow-y-auto rounded-xl bg-background p-5">
      <p className="text-sm text-muted">
        `bg-background` の入れ子パネルの中にある操作行は surface=&quot;background&quot; を使う。
      </p>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="mt-3 rounded-xl bg-card p-4 text-sm">
          行 {i + 1}
        </div>
      ))}
      <SheetActions surface="background" className="mt-5 flex gap-2">
        <Button fullWidth>保存する</Button>
      </SheetActions>
    </div>
  ),
};

export const ClassOnlyButton: Story = {
  render: () => (
    <div className="max-h-64 w-80 overflow-y-auto rounded-xl bg-card p-5 shadow-lg">
      <p className="text-sm text-muted">
        操作行がボタン 1 個の場所は sheetActionsClass() でクラスを直接足す（要素を増やさない）。
      </p>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="mt-3 rounded-xl bg-background p-4 text-sm">
          行 {i + 1}
        </div>
      ))}
      <button
        type="button"
        className={`${sheetActionsClass("card")} mt-5 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent`}
      >
        送信する
      </button>
    </div>
  ),
};

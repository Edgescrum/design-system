// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=14-121
// source=packages/ui/src/Modal.tsx
// component=Modal
import figma from "figma";
const instance = figma.selectedInstance;

const title = instance.getString("title");
const body = instance.getString("body");

// ボタン行は公開されたネストインスタンス。Button 側の Code Connect が描画する
// （レイヤー名から JSX を組み立てない）。
const buttons = instance.findConnectedInstances((n) => n.name === "Button");
const dismiss = buttons[0] && buttons[0].type === "INSTANCE" ? buttons[0].executeTemplate().example : undefined;
const confirm = buttons[1] && buttons[1].type === "INSTANCE" ? buttons[1].executeTemplate().example : undefined;

export default {
  // role="dialog" は既定（#1994 で opt-in から opt-out へ反転）。
  // アクセシブルネームは型で必須なので ariaLabel / ariaLabelledBy のどちらかを必ず渡す。
  // Escape・フォーカストラップ・呼び出し元への復帰は dialog-behavior が内蔵する（#2212）。
  example: figma.code`
<Modal open={open} onClose={onClose} ariaLabel="${title}">
  <h2 className="text-base font-semibold">${title}</h2>
  <p className="mt-2 text-sm text-muted">${body}</p>
  <div className="mt-4 flex gap-2">
    ${dismiss}
    ${confirm}
  </div>
</Modal>`,
  imports: ['import { Modal } from "@edgescrum/ds-core"'],
  id: "modal",
  metadata: { nestable: false },
};

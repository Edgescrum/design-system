// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=85-36
// source=packages/ui/src/SelectDropdown.tsx
// component=SelectDropdown
import figma from "figma";
const instance = figma.selectedInstance;

const text = instance.getString("text");
const size = instance.getEnum("size", { md: "md", sm: "sm" });
// state は props ではなく「選ばれているか」の見た目。
// placeholder のときだけ text が placeholder に落ちる。
const state = instance.getEnum("state", {
  placeholder: "placeholder",
  selected: "selected",
});

export default {
  // ★ ネイティブ <select> に戻さないこと（#192 / #1449）。見た目が OS ごとに割れる。
  //   キーボード操作・タイプアヘッド・選択中へのスクロール・<label htmlFor> 連携は
  //   この部品が内蔵している（移植のたびに書き直さない）。
  // ★ clearable は既定 false のまま使うこと（#1429）。必須の 2 択で true にすると
  //   「選び直すと選択解除」になり、画面はそのままで保存だけ別値が飛ぶ。
  example: figma.code`
<SelectDropdown
  options={options}
  value={value}
  onChange={setValue}
  ${size === "sm" ? 'size="sm"' : ""}
  ${state === "placeholder" ? `placeholder="${text}"` : ""}
  ariaLabel="選択"
/>`,
  imports: ['import { SelectDropdown } from "@edgescrum/ds-core"'],
  id: "select-dropdown",
  metadata: { nestable: true },
};

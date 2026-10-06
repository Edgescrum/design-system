// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=35-153
// source=packages/ui/src/Toggle.tsx
// component=Toggle
import figma from "figma";
const instance = figma.selectedInstance;

const checked = instance.getEnum("checked", {
  true: "true",
  false: "false",
});

export default {
  // onChange は必須。ON 色は既定で bg-success（LINE 緑）で、
  // 変えるときだけ activeColor を渡す。
  example: figma.code`<Toggle checked={${checked}} onChange={setChecked} ariaLabel="" />`,
  imports: ['import { Toggle } from "@edgescrum/ds-core"'],
  id: "toggle",
  metadata: { nestable: true },
};

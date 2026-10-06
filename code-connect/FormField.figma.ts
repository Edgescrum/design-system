// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=35-138
// source=packages/ui/src/FormField.tsx
// component=FormField
import figma from "figma";
const instance = figma.selectedInstance;

const label = instance.getString("label");
const placeholder = instance.getString("placeholder");
const required = instance.getBoolean("required");
const type = instance.getEnum("type", {
  input: "input",
  textarea: "textarea",
});

// コードでは「ラベル + 入力」で 1 部品ではなく、FormLabel と
// FormInput / FormTextarea を並べて書く（htmlFor と id で紐付ける）。
const control =
  type === "textarea"
    ? figma.code`<FormTextarea id="field" placeholder="${placeholder}" />`
    : figma.code`<FormInput id="field" placeholder="${placeholder}" />`;

export default {
  // ★ htmlFor の相手（id）を必ず同じファイルに置くこと（#1429 / #1461）。
  //   相手のいない htmlFor はタップしてもフォーカスが当たらず、
  //   form-label-htmlfor-1461.test.ts がソース走査で機械的に止める。
  example: figma.code`
<div>
  <FormLabel htmlFor="field"${required ? " required" : ""}>${label}</FormLabel>
  ${control}
</div>`,
  imports: [
    'import { FormLabel, FormInput, FormTextarea } from "@edgescrum/ds-core"',
  ],
  id: "form-field",
  metadata: { nestable: true },
};

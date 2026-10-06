// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=82-54
// source=packages/ui/src/StepProgress.tsx
// component=StepProgress
import figma from "figma";
const instance = figma.selectedInstance;

// Figma は total=4 固定。コードの total は任意なので、4 以外のウィザードでは
// ここの数値を実際のステップ数に置き換えること。
const current = instance.getEnum("current", {
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
});
const label = instance.getString("label");

export default {
  // ★ stepNames は **読み上げ専用**で見た目には出ない（label とは別物）。
  //   各 li の aria-label「ステップ N / M：<名前>」になるので、
  //   省略すると #902 と同じアクセシビリティ退行になる。渡すこと。
  example: figma.code`
<StepProgress
  current={${current}}
  total={4}
  label="${label}"
  stepNames={["基本情報", "日時", "確認", "完了"]}
/>`,
  imports: ['import { StepProgress } from "@edgescrum/ds-core"'],
  id: "step-progress",
  metadata: { nestable: true },
};

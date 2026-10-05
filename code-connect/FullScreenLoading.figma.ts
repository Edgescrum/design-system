// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=87-26
// source=packages/ui/src/FullScreenLoading.tsx
// component=FullScreenLoading
import figma from "figma";
const instance = figma.selectedInstance;

const message = instance.getString("message");

export default {
  // <main> を自分で出すので、ページ側でさらに <main> で包まないこと。
  example:
    message === "読み込み中..."
      ? figma.code`<FullScreenLoading />`
      : figma.code`<FullScreenLoading message="${message}" />`,
  imports: ['import { FullScreenLoading } from "@edgescrum/peco-ui"'],
  id: "full-screen-loading",
  metadata: { nestable: false },
};

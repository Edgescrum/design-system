// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=110-78
// source=packages/ui/src/CenteredNotice.tsx
// component=CenteredNotice
import figma from "figma";
const instance = figma.selectedInstance;

const title = instance.getString("title");
const description = instance.getString("description");
const note = instance.getString("note");
const showNote = instance.getBoolean("showNote");
const showActions = instance.getBoolean("showActions");

export default {
  // ★ 自分の <main> を描く。ページ側でさらに <main> で包まないこと。
  //   高さ（peco の min-h-app）は DS が知らないので className で渡す。
  example: figma.code`<CenteredNotice
  className="min-h-app"
  title="${title}"
  description="${description}"
  ${showNote ? figma.code`note="${note}"` : ""}
  ${showActions ? figma.code`actions={<Button variant="primary" size="md">…</Button>}` : ""}
/>`,
  imports: ['import { CenteredNotice } from "@edgescrum/ds-core"'],
  id: "centered-notice",
  metadata: { nestable: false },
};

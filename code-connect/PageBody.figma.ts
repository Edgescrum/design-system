// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=110-77
// source=packages/ui/src/PageBody.tsx
// component=PageBody
import figma from "figma";
const instance = figma.selectedInstance;

const content = instance.getSlot("Content");

export default {
  // ★ <main> と本文の余白はこの部品だけが持つ（ADR 0027）。className は受け取らない。
  //   viewport（sp / pc）は Figma 上の見本の切り替えで、コードでは 1 つのレスポンシブ部品。
  //   ページ側で py-* / pt-* を足さないこと（peco の検査が落とす）。
  example: figma.code`<PageBody>
  ${content}
</PageBody>`,
  imports: ['import { PageBody } from "@edgescrum/ds-core"'],
  id: "page-body",
  metadata: { nestable: false },
};

// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=83-19
// source=packages/ui/src/Tabs.tsx
// component=TabButton
import figma from "figma";
const instance = figma.selectedInstance;

const label = instance.getString("label");
const count = instance.getString("count");
const showCount = instance.getBoolean("showCount");
const active = instance.getEnum("active", {
  true: true,
  false: false,
});

export default {
  // ★ Figma の Tab は見た目だけの部品で、コードには 2 つの落とし先がある。
  //   - 同一ページ内で表示を切り替える → この TabButton（role="tab"）。
  //     **必ず TabList の中に置くこと**（role="tab" は role="tablist" の親が必須）。
  //   - 押すとページ遷移する → アプリ側の TabLink（<a href>）。role は付けず
  //     aria-current="page" で現在地を表す。tabItemClass() + TabUnderline を使う。
  example: figma.code`
<TabButton
  isActive={${active}}
  label="${label}"
  ${showCount ? figma.code`count={${count}}` : ""}
  onClick={() => setTab("${label}")}
/>`,
  imports: ['import { TabButton } from "@edgescrum/peco-ui"'],
  id: "tab",
  metadata: { nestable: true },
};

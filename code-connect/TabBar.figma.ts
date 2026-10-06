// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=83-20
// source=packages/ui/src/Tabs.tsx
// component=TabList
import figma from "figma";
const instance = figma.selectedInstance;

const tabs = instance.getSlot("tabs");

export default {
  // ★ 入れ物はコードに 2 種類ある。中身で選ぶこと。
  //   - TabButton（role="tab"）を並べる → TabList（role="tablist" を付ける。必須）
  //   - リンクを並べる → TabBar（role を付けない）。ページ最上部なら PageTabBar
  //     が本文と同じ横 padding を内包する。
  // 幅に収まらないときは**ページではなくタブバーが**横スクロールする（#2266）。
  example: figma.code`<TabList>${tabs}</TabList>`,
  imports: ['import { TabList } from "@edgescrum/ds-core"'],
  id: "tab-bar",
  metadata: { nestable: false },
};

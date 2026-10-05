// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=84-20
// source=packages/ui/src/icons.tsx
// component=ChevronDownIcon
import figma from "figma";

// 既定サイズ 14px（SelectDropdown の直書きから移した実値・#21）。
// 開いている間の反転は呼び出し側の rotate-180 が担う — 開閉状態を知っているのは
// トリガーであってアイコンではないので、回転をこの中に入れない。
export default {
  example: figma.code`<ChevronDownIcon />`,
  imports: ['import { ChevronDownIcon } from "@edgescrum/peco-ui"'],
  id: "icon-chevron-down",
  metadata: { nestable: true },
};

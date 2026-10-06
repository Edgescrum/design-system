// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=30-13
// source=packages/ui/src/icons.tsx
// component=ChevronRightIcon
import figma from "figma";

// Figma の原型は 24×24 で統一してあるが、**コードの既定サイズはアイコンごとに違う**
// （ChevronRightIcon は 14px）。Figma 側で他の大きさに置いているときは
// width / height を明示すること。色は currentColor なので親の text-* で決まる。
export default {
  example: figma.code`<ChevronRightIcon />`,
  imports: ['import { ChevronRightIcon } from "@edgescrum/ds-core"'],
  id: "icon-chevron-right",
  metadata: { nestable: true },
};

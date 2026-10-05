// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=30-16
// source=packages/ui/src/icons.tsx
// component=ChevronLeftIcon
import figma from "figma";

// Figma の原型は 24×24 で統一してあるが、**コードの既定サイズはアイコンごとに違う**
// （ChevronLeftIcon は 20px）。Figma 側で他の大きさに置いているときは
// width / height を明示すること。色は currentColor なので親の text-* で決まる。
export default {
  example: figma.code`<ChevronLeftIcon />`,
  imports: ['import { ChevronLeftIcon } from "@edgescrum/peco-ui"'],
  id: "icon-chevron-left",
  metadata: { nestable: true },
};

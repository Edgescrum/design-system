// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=30-70
// source=packages/ui/src/icons.tsx
// component=ArrowLeftIcon
import figma from "figma";

// Figma の原型は 24×24 で統一してあるが、**コードの既定サイズはアイコンごとに違う**
// （ArrowLeftIcon は 20px）。Figma 側で他の大きさに置いているときは
// width / height を明示すること。色は currentColor なので親の text-* で決まる。
export default {
  example: figma.code`<ArrowLeftIcon />`,
  imports: ['import { ArrowLeftIcon } from "@edgescrum/peco-ui"'],
  id: "icon-arrow-left",
  metadata: { nestable: true },
};

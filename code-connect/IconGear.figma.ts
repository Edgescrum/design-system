// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=30-32
// source=packages/ui/src/icons.tsx
// component=GearIcon
import figma from "figma";

// Figma の原型は 24×24 で統一してあるが、**コードの既定サイズはアイコンごとに違う**
// （GearIcon は 16px）。Figma 側で他の大きさに置いているときは
// width / height を明示すること。色は currentColor なので親の text-* で決まる。
export default {
  example: figma.code`<GearIcon />`,
  imports: ['import { GearIcon } from "@edgescrum/peco-ui"'],
  id: "icon-gear",
  metadata: { nestable: true },
};

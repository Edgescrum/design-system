// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=30-39
// source=packages/ui/src/icons.tsx
// component=PhoneIcon
import figma from "figma";

// Figma の原型は 24×24 で統一してあるが、**コードの既定サイズはアイコンごとに違う**
// （PhoneIcon は 18px）。Figma 側で他の大きさに置いているときは
// width / height を明示すること。色は currentColor なので親の text-* で決まる。
export default {
  example: figma.code`<PhoneIcon />`,
  imports: ['import { PhoneIcon } from "@edgescrum/peco-ui"'],
  id: "icon-phone",
  metadata: { nestable: true },
};

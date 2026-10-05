// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=30-57
// source=packages/ui/src/icons.tsx
// component=MenuListIcon
import figma from "figma";

// Figma の原型は 24×24 で統一してあるが、**コードの既定サイズはアイコンごとに違う**
// （MenuListIcon は 16px）。Figma 側で他の大きさに置いているときは
// width / height を明示すること。色は currentColor なので親の text-* で決まる。
export default {
  example: figma.code`<MenuListIcon />`,
  imports: ['import { MenuListIcon } from "@edgescrum/peco-ui"'],
  id: "icon-menu-list",
  metadata: { nestable: true },
};

// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=30-49
// source=packages/ui/src/icons.tsx
// component=HeartIcon
import figma from "figma";

// 既定サイズ 16px。**filled でパスの塗りが切り替わる**唯一のアイコンで、
// お気に入りの ON / OFF に使う（Figma 側は線のみの状態を置いている）。
export default {
  example: figma.code`<HeartIcon />`,
  imports: ['import { HeartIcon } from "@edgescrum/ds-core"'],
  id: "icon-heart",
  metadata: { nestable: true },
};

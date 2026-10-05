// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=6-63
// source=packages/ui/src/Button.tsx
// component=Button
import figma from "figma";
const instance = figma.selectedInstance;

const label = instance.getString("label");
const variant = instance.getEnum("variant", {
  primary: "primary",
  secondary: "secondary",
  soft: "soft",
  outline: "outline",
  ghost: "ghost",
  danger: "danger",
  success: "success",
  inverse: "inverse",
  "danger-outline": "danger-outline",
  "danger-text": "danger-text",
});
const size = instance.getEnum("size", {
  sm: "sm",
  md: "md",
  lg: "lg",
});

export default {
  // variant / size は既定値（primary / md）のときも明示する。
  // Figma 側で選んだ値がそのまま読めるほうが、実装時の取りこぼしが無い。
  example: figma.code`<Button variant="${variant}" size="${size}">${label}</Button>`,
  imports: ['import { Button } from "@edgescrum/peco-ui"'],
  id: "button",
  metadata: { nestable: true },
};

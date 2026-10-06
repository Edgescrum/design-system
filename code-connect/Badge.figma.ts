// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=6-84
// source=packages/ui/src/Badge.tsx
// component=Badge
import figma from "figma";
const instance = figma.selectedInstance;

const label = instance.getString("label");
const tone = instance.getEnum("tone", {
  neutral: "neutral",
  accent: "accent",
  danger: "danger",
  warning: "warning",
  positive: "positive",
  info: "info",
});
const variant = instance.getEnum("variant", {
  solid: "solid",
  soft: "soft",
  outline: "outline",
});
const size = instance.getEnum("size", {
  sm: "sm",
  md: "md",
});

export default {
  example: figma.code`<Badge tone="${tone}" variant="${variant}" size="${size}">${label}</Badge>`,
  imports: ['import { Badge } from "@edgescrum/ds-core"'],
  id: "badge",
  metadata: { nestable: true },
};

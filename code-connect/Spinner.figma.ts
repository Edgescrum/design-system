// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=82-17
// source=packages/ui/src/Spinner.tsx
// component=Spinner
import figma from "figma";
const instance = figma.selectedInstance;

const size = instance.getEnum("size", {
  sm: "sm",
  md: "md",
  lg: "lg",
});

export default {
  // md が既定なので sm / lg のときだけ渡す。
  example:
    size === "md"
      ? figma.code`<Spinner />`
      : figma.code`<Spinner size="${size}" />`,
  imports: ['import { Spinner } from "@edgescrum/peco-ui"'],
  id: "spinner",
  metadata: { nestable: true },
};

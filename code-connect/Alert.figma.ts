// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=14-90
// source=packages/ui/src/Alert.tsx
// component=Alert
import figma from "figma";
const instance = figma.selectedInstance;

const message = instance.getString("message");
const type = instance.getEnum("type", {
  error: "error",
  success: "success",
  warning: "warning",
});

export default {
  // role は部品側が type から決める（error=alert / その他=status・#1165）。
  // 呼び出し側で role を巻かないこと。
  example: figma.code`<Alert type="${type}">${message}</Alert>`,
  imports: ['import { Alert } from "@edgescrum/peco-ui"'],
  id: "alert",
  metadata: { nestable: true },
};

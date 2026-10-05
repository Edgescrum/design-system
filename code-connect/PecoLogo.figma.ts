// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=31-9
// source=packages/ui/src/icons.tsx
// component=PecoLogo
import figma from "figma";

// ★ 商標的アセットなので MIT ライセンスの対象外（README に明記）。
//   大きさは高さのクラスで決める（例: FullScreenLoading は h-10）。
//   単体で置くときは aria-label を付けること（装飾でないなら読み上げ対象）。
export default {
  example: figma.code`<PecoLogo aria-label="PeCo" className="h-10" />`,
  imports: ['import { PecoLogo } from "@edgescrum/peco-ui"'],
  id: "peco-logo",
  metadata: { nestable: true },
};

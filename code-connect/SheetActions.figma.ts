// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=50-290
// source=packages/ui/src/SheetActions.tsx
// component=SheetActions
import figma from "figma";
const instance = figma.selectedInstance;

const surface = instance.getEnum("surface", {
  card: "card",
  background: "background",
});
// SLOT プロパティ。中に置かれた Button 等はそれぞれの Code Connect が描画する。
const actions = instance.getSlot("actions");

export default {
  // className には元の行が持っていたレイアウト用クラスをそのまま渡す（#1691）。
  // surface は「操作行が乗っている面と同じ色」を選ぶこと。違う色にすると、
  // 貼り付いていない通常時に色の違う帯が見えて「見た目が変わらない」が壊れる。
  example: figma.code`<SheetActions surface="${surface}" className="mt-5 flex gap-2">${actions}</SheetActions>`,
  imports: ['import { SheetActions } from "@edgescrum/peco-ui"'],
  id: "sheet-actions",
  metadata: { nestable: true },
};

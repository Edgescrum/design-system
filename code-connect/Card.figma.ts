// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=35-184
// component=Card
import figma from "figma";
const instance = figma.selectedInstance;

const title = instance.getString("title");
const note = instance.getString("note");
const showNote = instance.getBoolean("showNote");
const content = instance.getSlot("content");
const type = instance.getEnum("type", {
  vertical: "vertical",
  horizontal: "horizontal",
});

export default {
  // ★ **コードに Card 部品は無い。** 面のクラスを各画面が直接書いている
  //   （peco 内で最も多いのは `rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border`。
  //   枠線は border ではなく ring-1 ring-inset 系で統一されている）。
  //   Figma 側は「情報をまとめる面」のまとめ役なので、実装では囲みの div に落とすこと。
  //   部品化したくなったら DS に起票してから — ここに import を足さない。
  example: figma.code`
<div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
  <div className="flex items-center gap-2">
    <h2 className="text-sm font-semibold text-foreground">${title}</h2>
    ${showNote ? figma.code`<span className="text-xs text-danger">${note}</span>` : ""}
  </div>
  <div className="mt-3 flex ${type === "horizontal" ? "flex-row items-center gap-3" : "flex-col gap-2"}">
    ${content}
  </div>
</div>`,
  imports: [],
  id: "card",
  metadata: { nestable: false },
};

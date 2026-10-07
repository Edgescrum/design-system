// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=50-232
// source=packages/ui/src/AppBar.tsx
// component=AppBar
import figma from "figma";
const instance = figma.selectedInstance;

const title = instance.getString("title");
const showBack = instance.getBoolean("showBack");
const showTitle = instance.getBoolean("showTitle");
const showLogo = instance.getBoolean("showLogo");
const showRight = instance.getBoolean("showRight");

// 戻るアイコンは INSTANCE_SWAP。差し替えたものがあればそれを描く。
const icon = instance.getInstanceSwap("icon");
let iconSnippet;
if (icon && icon.type === "INSTANCE" && icon.hasCodeConnect()) {
  iconSnippet = icon.executeTemplate().example;
}

const back = showBack
  ? figma.code`back={
    <Link href={backHref} aria-label="戻る" className={APP_BAR_BACK_CLASS}>
      ${iconSnippet ?? figma.code`<ChevronLeftIcon size={20} />`}
    </Link>
  }`
  : "";

export default {
  // ★ 旧 `AppHeader.figma.ts` は DS に実体が無く `imports: []` で生のマークアップを吐いていた
  //   （z-20 / z-40・bg-card / bg-card/80 backdrop-blur-lg・sm:hidden の 3 点が実コードと食い違い）。
  //   ADR 0027 で ds-core の AppBar になったので、ここは部品の呼び出しだけを吐く。
  // ★★ ボタンを足さないこと（#2039 → #2090）。右スロットは表示用（店舗名など）。
  // `back` の <Link> と戻り先の決め方（useSmartBack）はプロダクトが持つ。DS は next/link を知らない。
  example: figma.code`<AppBar
  ${back}
  ${showTitle ? figma.code`title="${title}"` : ""}
  ${showLogo ? figma.code`logo={<PecoLogo className="h-5" />}` : ""}
  ${showRight ? figma.code`right={<StoreBadge name={provider.name} />}` : ""}
/>`,
  imports: ['import { AppBar, APP_BAR_BACK_CLASS } from "@edgescrum/ds-core"'],
  id: "app-bar",
  metadata: { nestable: false },
};

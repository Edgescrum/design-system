// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=50-232
// component=ProviderNav
import figma from "figma";
const instance = figma.selectedInstance;

const title = instance.getString("title");
const showStore = instance.getBoolean("showStore");

// 戻るアイコンは INSTANCE_SWAP。差し替えたものがあればそれを描く。
const icon = instance.getInstanceSwap("icon");
let iconSnippet;
if (icon && icon.type === "INSTANCE" && icon.hasCodeConnect()) {
  iconSnippet = icon.executeTemplate().example;
}

export default {
  // ★ これは DS の部品ではない。peco の
  //   `src/app/provider/[slug]/provider-nav.tsx`（モバイル時のヘッダー）の写しで、
  //   @edgescrum/ds-core には存在しない。import を足さないこと。
  // ★★ **ここにボタンを足さないこと**（#2039 → #2090）。
  //   ヘッダーは「戻る + 画面名（+ 店舗名）」だけで、操作は本文か SheetActions に置く。
  //   足すたびに幅が足りなくなり、タイトルが 2 行に折れて戻るボタンが押しにくくなる。
  example: figma.code`
<header className="sticky top-0 z-20 border-b border-border bg-card">
  <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
    <Link
      href={backHref}
      aria-label="戻る"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg active:bg-accent-bg"
    >
      ${iconSnippet ?? figma.code`<ChevronLeftIcon />`}
    </Link>
    <h1 className="line-clamp-2 flex-1 text-base font-semibold">${title}</h1>
    ${showStore ? figma.code`<StoreBadge name={provider.name} />` : ""}
  </div>
</header>`,
  imports: [],
  id: "app-header",
  metadata: { nestable: false },
};

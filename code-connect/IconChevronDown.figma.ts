// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=84-20
// source=packages/ui/src/icons.tsx
// component=ChevronDown
import figma from "figma";

// ★ icons.tsx に ChevronDownIcon は **無い**。SelectDropdown が svg を直書きしている
//   （Pagination も同様に自前の chevron を持つ）。ここで export を名乗ると嘘になるので、
//   実体に合わせて素の svg を出す。共通化するなら icons.tsx への追加が先。
export default {
  example: figma.code`
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
  <path d="m6 9 6 6 6-6" />
</svg>`,
  imports: [],
  id: "icon-chevron-down",
  metadata: { nestable: true },
};

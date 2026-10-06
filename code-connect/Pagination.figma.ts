// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=85-37
// source=packages/ui/src/Pagination.tsx
// component=Pagination
import figma from "figma";

// Figma の summary / current / total は**表示文字列**で、props ではない。
// コードは totalItems / pageSize / currentPage から自分で組み立てる
// （件数サマリーは幅で出し分かれる: SP「1〜10 / 123件」/ PC「123件中 1〜10件を表示」）。

export default {
  // ★ totalPages <= 1 のとき、この部品は **null を返して何も描かない**
  //   （画面のチラつき防止）。1 ページで必ず出したい表示をここに期待しないこと。
  example: figma.code`
<Pagination
  totalItems={totalItems}
  pageSize={DEFAULT_PAGE_SIZE}
  currentPage={page}
  onPageChange={setPage}
/>`,
  imports: [
    'import { Pagination, DEFAULT_PAGE_SIZE } from "@edgescrum/ds-core"',
  ],
  id: "pagination",
  metadata: { nestable: true },
};

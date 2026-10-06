/**
 * #21 の置換が画素に影響しないことを確かめる使い捨て検証。
 *
 * 直書き svg を共通アイコンに寄せたので、**出力される svg の属性集合が
 * 置換前と同一である**ことを機械的に確かめる。属性の並び順は React が
 * props を当てた順になるため比較から外す（並び順は描画に影響しない）。
 *
 * 置換前の期待値は、置換前のソース（git show HEAD~ で読める）から
 * 手で書き起こしたもの。
 *
 * ## 走らせ方
 *
 *   pnpm --filter @edgescrum/ds-core build   # dist を作ってから
 *   node apps/storybook/scripts/verify-icon-consolidation.mjs
 *
 * **このディレクトリに置いてあるのは react-dom がここにしか無いから。**
 * リポジトリ直下には react-dom の依存が無く、root から走らせると
 * ERR_MODULE_NOT_FOUND になる（検証のためだけに root へ依存を足していない）。
 */
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { Pagination, SelectDropdown, CheckIcon } from "../../../packages/ui/dist/index.js";

/** <svg ...> の属性を {名前: 値} に分解する（並び順は捨てる）。 */
function svgAttrs(html) {
  return [...html.matchAll(/<svg\s([^>]*)>/g)].map((m) => {
    const attrs = {};
    for (const a of m[1].matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    return attrs;
  });
}
function paths(html) {
  return [...html.matchAll(/<path d="([^"]*)"/g)].map((m) => m[1]);
}
const sorted = (o) =>
  JSON.stringify(Object.fromEntries(Object.entries(o).sort()));

const results = [];
function check(name, actual, expected) {
  const ok = sorted(actual) === sorted(expected);
  results.push({ name, ok, actual: sorted(actual), expected: sorted(expected) });
}

/* ---------------- Pagination ---------------- */
const pagHtml = renderToStaticMarkup(
  React.createElement(Pagination, {
    totalItems: 123,
    pageSize: 10,
    currentPage: 2,
    onPageChange: () => {},
  })
);
const pagSvgs = svgAttrs(pagHtml);
const pagPaths = paths(pagHtml);

// 置換前のローカル定義（strokeWidth 2.5 + 丸端・14px・class は未指定）
const ARROW_EXPECTED = {
  width: "14",
  height: "14",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2.5",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};
check("Pagination 前へ（属性）", pagSvgs[0] ?? {}, ARROW_EXPECTED);
check("Pagination 次へ（属性）", pagSvgs[1] ?? {}, ARROW_EXPECTED);
check("Pagination path", { d: pagPaths.join(" | ") }, {
  d: "m15 18-6-6 6-6 | m9 18 6-6-6-6",
});

/* ---------------- SelectDropdown（閉じた状態・選択済み） ---------------- */
const selHtml = renderToStaticMarkup(
  React.createElement(SelectDropdown, {
    options: [
      { value: "30", label: "30分" },
      { value: "60", label: "60分" },
    ],
    value: "60",
    onChange: () => {},
  })
);
const selSvgs = svgAttrs(selHtml);
const selPaths = paths(selHtml);

// 置換前の直書き（14px・strokeWidth 2・aria-hidden・rotate クラス）
check("SelectDropdown シェブロン（属性）", selSvgs[0] ?? {}, {
  width: "14",
  height: "14",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "aria-hidden": "true",
  class: "shrink-0 text-muted transition-transform ",
});
check("SelectDropdown シェブロン path", { d: selPaths.join(" | ") }, {
  d: "m6 9 6 6 6-6",
});

/* ---------------- SelectDropdown の選択済みチェック ----------------
   開いた状態でしか出ないため SSR では描けない。置換後の呼び出しと
   同じ props でアイコン単体を描いて、置換前の直書きと突き合わせる。 */
const checkHtml = renderToStaticMarkup(
  React.createElement(CheckIcon, {
    width: 14,
    height: 14,
    "aria-hidden": "true",
    className: "ml-auto text-accent",
  })
);
check("SelectDropdown チェック（属性）", svgAttrs(checkHtml)[0] ?? {}, {
  width: "14",
  height: "14",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2.5",
  "aria-hidden": "true",
  class: "ml-auto text-accent",
});
check("SelectDropdown チェック path", { d: paths(checkHtml).join(" | ") }, {
  d: "M20 6 9 17l-5-5",
});

for (const r of results) {
  console.log(`${r.ok ? "OK  " : "NG  "} ${r.name}`);
  if (!r.ok) {
    console.log(`     期待: ${r.expected}`);
    console.log(`     実際: ${r.actual}`);
  }
}
const failed = results.filter((r) => !r.ok).length;
console.log(failed === 0 ? "\n全一致（画素差分なし）" : `\n${failed} 件不一致`);
process.exit(failed === 0 ? 0 : 1);

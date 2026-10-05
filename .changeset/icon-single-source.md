---
"@edgescrum/peco-ui": minor
---

`ChevronDownIcon` を追加し、アイコンの出どころを `icons.tsx` に一本化（#21）。

同じ chevron が 3 箇所で別々に定義されていた。

- `Pagination` が `icons.tsx` と**同名**の `ChevronLeftIcon` / `ChevronRightIcon` を
  ローカル定義していて、path は 1 文字も同じなのに `strokeWidth` と端の処理だけ違った
  （2.5 + 丸端 ／ `icons.tsx` は 2 + 既定端）
- `SelectDropdown` は下向き chevron とチェックマークを svg 直書きしていた
  （`icons.tsx` に `ChevronDownIcon` が無かった）

同じ名前で別物があると、`Pagination` を読んだ人が共通アイコンを掴んだつもりで
別の線幅を見ることになる。

**画素差分は無い。** `icons.tsx` 側の既定値は変えず（変えると `ChevronRightIcon` の
他の呼び出し元すべての線が太くなる）、差分は呼び出し側から props で渡している。
出力される svg の属性集合が置換前と同一であることを
`apps/storybook/scripts/verify-icon-consolidation.mjs` で機械的に確認した（7 件すべて一致）。

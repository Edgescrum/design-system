---
"@edgescrum/ds-foundation": minor
---

文字サイズ・太さ・余白・動きにプリミティブ層を追加し（`font-size.*` / `font-weight.*` / `space-scale.*`（4px グリッド）/ `duration.*` / `easing.*`（IBM Carbon の productive / expressive））、作業画面の用途トークン（`text.*` / `font.weight.*` / `space.*`）をプリミティブへの別名に書き換えた。生成される CSS 変数・theme・JSON の既存の値は 1 バイトも変わらない（追加のみ）。

動きの用途トークン（`motion.duration.{state-change,feedback,surface,screen}` / `motion.productive.*` / `motion.expressive.*` / `motion.transition.*`）を約束付きで追加。Tailwind では `duration-surface` / `ease-productive-enter` 等、組み合わせは CSS 変数 `--motion-transition-*` で使える。`prefers-reduced-motion: reduce` のときは `tokens.css` が動きの変数を `0ms` に上書きし、色・不透明度の変化（150ms）だけを残す。`DESIGN.md` の先頭 YAML に `motion` 節とプリミティブの段（`typography.scale.*` / `spacing.scale.*`）、本文に Motion 節を追加（peco 25_design-system.md §10-9）。

---
"@edgescrum/ds-foundation": minor
---

作業画面の文字の階層（`text.role.heading` / `body` / `help` / `caption` / `numeric`）、太さ 3 種（`font.weight.regular` / `emphasis` / `strong`）、用途の余白 3 種（`space.inset` / `related` / `group`）を追加。各トークンに使い方の約束（`$extensions["com.edgescrum.usage"]`）を付けた。Tailwind では `text-role-*` / `font-regular` 等 / `p-inset` `gap-related` `gap-group` 等で使える。パッケージに `DESIGN.md`（先頭 YAML は DTCG から生成）を同梱。既存の CSS 変数・theme・JSON は追加のみで変更なし（peco 25_design-system.md §10・ADR-0032）。

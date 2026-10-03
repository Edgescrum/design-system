# @edgescrum/peco-tokens

## 0.2.0

### Minor Changes

- bd8332a: Button に `danger-outline` / `danger-text` variant を追加（#11 裁定・2026-10-04）。peco の DangerZone 4 役割システム（トリガー / 確定 / 取消 / テキスト）を DS Button で完全移行できるようにする。tokens にはトリガーの枠線用セマンティックトークン `color/danger-border`（= red.200）を追加。

### Patch Changes

- 53fa092: Figma 同期が dimension トークン（radius/* text/*）を FLOAT Variable として配信するように修正（従来は色のみで、数値トークンが Figma に存在しなかった）。rem は ×16 で px 換算。

## 0.1.0

### Minor Changes

- acae5fa: 2026-09-27 監査に基づくトークン拡張: ステータス色のセマンティック層（danger / warning / positive / info / on-accent + 各 -bg）、ステータス系プリミティブ（Tailwind v4 oklch 実値）、text/2xs・3xs、radius/control・surface を追加。既存 10 変数は名前・値とも不変。

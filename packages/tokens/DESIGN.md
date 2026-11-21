---
# 生成物（DTCG と package.json から build が書き込む）。手で編集しないこと。
version: "alpha"
name: "@edgescrum/ds-foundation"
description: "Edgescrum design system — foundation layer. DTCG JSON as the source of truth, built to CSS variables and a Tailwind v4 theme. The minimum bar every Edgescrum product meets."
colors:
  background: "#faf8f6"
  foreground: "#3d2c2c"
  accent: "#f08c79"
  accent-light: "#f5a899"
  accent-dark: "#d97365"
  accent-bg: "#fef2f0"
  success: "#06C755"
  card: "#ffffff"
  border: "#ece4e0"
  muted: "#8c7a7a"
  on-accent: "#ffffff"
  danger: "oklch(57.7% 0.245 27.325)"
  danger-bg: "oklch(97.1% 0.013 17.38)"
  danger-border: "oklch(88.5% 0.062 18.334)"
  warning: "oklch(55.5% 0.163 48.998)"
  warning-bg: "oklch(98.7% 0.022 95.277)"
  positive: "oklch(62.7% 0.194 149.214)"
  positive-bg: "oklch(98.2% 0.018 155.826)"
  info: "oklch(48.8% 0.243 264.376)"
  info-bg: "oklch(97% 0.014 254.604)"
  rating:
    "1":
      bg: "oklch(97.1% 0.013 17.38)"
      fg: "oklch(57.7% 0.245 27.325)"
      border: "oklch(93.6% 0.032 17.717)"
    "2":
      bg: "oklch(98% 0.016 73.684)"
      fg: "oklch(64.6% 0.222 41.116)"
      border: "oklch(95.4% 0.038 75.164)"
    "3":
      bg: "oklch(98.7% 0.026 102.212)"
      fg: "oklch(55.4% 0.135 66.442)"
      border: "oklch(97.3% 0.071 103.193)"
    "4":
      bg: "oklch(98.2% 0.018 155.826)"
      fg: "oklch(62.7% 0.194 149.214)"
      border: "oklch(96.2% 0.044 156.743)"
    "5":
      bg: "oklch(98.2% 0.018 155.826)"
      fg: "oklch(52.7% 0.154 150.069)"
      border: "oklch(92.5% 0.084 155.995)"
    unknown:
      bg: "oklch(98.5% 0.002 247.839)"
      fg: "oklch(44.6% 0.03 256.802)"
      border: "oklch(96.7% 0.003 264.542)"
typography:
  "2xs":
    fontSize: "0.6875rem"
  "3xs":
    fontSize: "0.625rem"
  role:
    heading:
      fontSize: "1.125rem"
    body:
      fontSize: "0.875rem"
    help:
      fontSize: "0.75rem"
    caption:
      fontSize: "{typography.2xs.fontSize}"
    numeric:
      fontSize: "1.5rem"
  family:
    sans:
      fontFamily: "var(--font-dm-sans), system-ui, -apple-system, 'Hiragino Sans', 'Yu Gothic', Meiryo, sans-serif"
    mono:
      fontFamily: "var(--font-geist-mono)"
  weight:
    regular:
      fontWeight: 400
    emphasis:
      fontWeight: 600
    strong:
      fontWeight: 700
rounded:
  control: "0.75rem"
  control-sm: "0.5rem"
  surface: "1rem"
spacing:
  page:
    block: "1.5rem"
    block-sm: "2rem"
    inline: "1rem"
    inline-sm: "2rem"
  inset: "1rem"
  related: "0.5rem"
  group: "1.5rem"
  content:
    admin: "1280px"
    narrow: "42rem"
    flow: "56rem"
    flow-compact: "32rem"
    wide: "64rem"
    lp: "72rem"
---
# @edgescrum/ds-foundation

トークン（値）の層。Edgescrum の全プロダクトが必ず使う（minimum bar）。
値の正は DTCG の JSON（`@tokens/color.semantic.json` ほか）で、**この先頭の YAML は build が書き込む写し**。
トークンごとの使い方の約束は、DTCG の各トークンの `$extensions["com.edgescrum.usage"]` にある
（欄は purpose / use_when / dont_use_when / never / check / decided_by）。

## Never（このパッケージ全体）

- 色・文字サイズ・太さ・余白・角丸の値を直書きしない。トークンを使う
- 任意 px 指定（`text-[11px]` / `p-[14px]` / `font-[550]` 等）を書かない
- プリミティブ（`color.*`）をアプリから直接使わない。セマンティックの役割トークンを使う
- 約束の無いトークンを足さない。どの `dont_use_when` の矢印の先にも当てはまらなければ、作らずに止めて運用者に上げる
- この先頭の YAML を手で直さない。値は DTCG を直して build する

## Typography（作業画面の文字の階層・5 段）

約束: `@tokens/dimension.json`（`text.role.*`）。Tailwind では `text-role-<名前>`。

- `text.role.heading` 1.125rem — 作業画面のカード・セクションの見出し
- `text.role.body` 0.875rem — 本文・入力値・一覧の行
- `text.role.help` 0.75rem — 入力欄・設定の補足 1 文（1 文・40 字・括弧書きなし）
- `text.role.caption` 0.6875rem — 日時・件数などの小さい注記（`text.2xs` の別名）
- `text.role.numeric` 1.5rem — 画面の主役の数値

太さは 3 種類。約束: `@tokens/typography.json`（`font.weight.*`）。Tailwind では `font-<名前>`。

- `font.weight.regular` 400 — 本文・補足・注記
- `font.weight.emphasis` 600 — 見出し・ラベル・ボタン
- `font.weight.strong` 700 — 数値表示・ごく短い強調

宣伝ページ（LP）の大きな文字は作業画面の 5 段とは別系統にする（未収載）。
`text.2xs` / `text.3xs` は役割を持たない段で、新しいコードは役割の 5 段を使う。

## Layout（余白は用途で 4 種類）

約束: `@tokens/dimension.json`（`space.*`）。Tailwind では `p-<名前>` / `gap-<名前>` / `space-y-<名前>`。

- `space.inset` 1rem — 部品の中（カード・パネル・行の内側）
- `space.related` 0.5rem — 関係が近いもの同士（ラベルと入力欄・アイコンと文字）
- `space.group` 1.5rem — まとまり同士の間（セクション・カード同士）
- `space.page.*` — ページ本文の外枠。持ち主は ds-core の `PageBody` で、ページは書かない

本文の最大幅（`size.content.*`）の持ち主は `PageBody` / `AppBar` の `width`。

## Colors / Shapes

色の役割は `@tokens/color.semantic.json`、角丸の役割（`radius.*`）は `@tokens/dimension.json`。
使い方の約束は未記入（peco 25_design-system.md §10-6 の 7 で書く）。

## Decided by

peco `docs/v2/requirements/25_design-system.md` §10（とくに §10-8 の上限）と
`docs/adr/0032-ai-readable-usage-contracts-live-next-to-tokens-and-parts.md`。

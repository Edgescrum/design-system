---
"@edgescrum/ds-foundation": minor
---

ページ余白 `space.page.*` と本文幅 `size.content.*` を足す（ADR 0027 段 0）

| トークン | 値 | :root | Tailwind ユーティリティ |
|---|---|---|---|
| `space.page.block` / `block-sm` | 1.5rem / 2rem | `--space-page-block(-sm)` | `py-page-block` / `sm:py-page-block-sm` |
| `space.page.inline` / `inline-sm` | 1rem / 2rem | `--space-page-inline(-sm)` | `px-page-inline` / `sm:px-page-inline-sm` |
| `size.content.admin` | 1280px | `--size-content-admin` | `max-w-content-admin` |
| `size.content.narrow` / `flow` / `flow-compact` / `wide` / `lp` | 42 / 56 / 32 / 64 / 72rem | `--size-content-*` | `max-w-content-*` |

- 値は peco の現行の描画と同じ（`px-4 py-6 sm:px-8 sm:py-8` / `max-w-[1280px]` / `PUBLIC_WIDTH_CLASS`）。`verify.mjs` が固定している
- 接尾辞 `-sm` は「sm（640px）以上で使う値」。トークンはメディアクエリを持てないので 2 本に分けた。`flow-compact` は `flow` の sm 未満の上限（peco の `max-w-lg sm:max-w-4xl`）
- theme は `--spacing-page-*: var(--space-page-*)` / `--container-content-*: var(--size-content-*)` と **var() 経由**で出す。**モードで上書きできる**（`modes/<名>.json` に `size.content.admin` などを書く）
- ★ `text.*` / `radius.*` はモードで上書きできない（ビルドが落ちる）。theme に実値で焼き込まれていて、上書きしても効かないため
- **既存の生成物は 1 行も変わらない**（`tokens.css` / `theme.css` / `tokens.json` は追記のみ・`primitives.css` は不変）

★ `build.mjs` は「色以外の名前空間」を列挙して除外する方式で、`space` / `size` を足しただけでは
**`--color-space-page-block`（= `bg-space-page-block`）として出ていた**。除外リストに足し、
`verify:layout-tokens` が「色として出ていないこと」を見る（ミューテーションで FAIL を確認済み）。

main へのマージで figma-sync が走り、Figma の Semantic コレクションに `space/page/*` / `size/content/*` の FLOAT 変数が作られる。

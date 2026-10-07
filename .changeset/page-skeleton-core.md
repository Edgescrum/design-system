---
"@edgescrum/ds-core": minor
---

ページの骨格の部品 `PageBody` / `AppBar` / `CenteredNotice` を足し、`PageTabBar` に `placement` を足す（ADR 0027 段 0）

シェル自体はプロダクトが持ち、DS は部品とトークンだけを持つ（ADR 0027 Decision 1）。

- **`PageBody`** — `<main>` と本文の余白の**唯一の持ち主**。余白は `space.page.*` で、**`className` を受け取らない**（ページが余白を書けたことがコピーとずれの発生源だったため）。`width`（`"none"` 既定 / `admin` / `narrow` / `flow` / `wide` / `lp`）・`fill`（`flex-1`）・`data-*` の素通し
- **`AppBar`** — sticky ヘッダー。peco の `CustomerPageHeader` と同じクラス列（左右余白だけトークン）。`back` / `title`（h1）か `logo` / `right` / `width`（既定 `flow`）/ `className`（`<header>` のレスポンシブ出し分け専用）。戻るボタンのクラスは `APP_BAR_BACK_CLASS`（DS は `next/link` を import できないので、リンクはプロダクトが渡す）
- **`CenteredNotice`** — 行き止まりの状態表示。自分で `<main>` を描く。`title` / `description` / `note` / `icon` / `logo` / `actions` / `className`（**最小の高さ専用**。`min-h-app` は peco 固有なので DS は書かない）
- **`PageTabBar` の `placement`** — 既定 `"above-body"` は**DOM も見た目も従来と 1 バイトも変わらない**（`verify.mjs` が描画して比べる）。`"in-body"` は `PageBody` の中に置き、**自分の下の余白（`pb-4 sm:pb-6`）を持つ**。ページの `pt-4 sm:pt-6` の代償が要らなくなる
- `CONTENT_WIDTH_CLASS` / `ContentWidth` — `PageBody` と `AppBar` が共有する幅の表

★ 新しいクラス（`py-page-block` / `max-w-content-*` など）は `@edgescrum/ds-foundation` の
この版の `theme.css` が定義する。**ds-foundation を上げずに ds-core だけ上げると、余白と幅が黙って消える**
（Tailwind は未知のクラスを無視し、型エラーもビルドエラーも出ない）。

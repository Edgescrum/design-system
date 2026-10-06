# @edgescrum/ds-foundation（旧 @edgescrum/peco-tokens）

## 0.4.0

### Minor Changes

- 39a4995: パッケージ名を層の名前に改める（ADR 0026 作業 4）

  - `@edgescrum/peco-tokens` → **`@edgescrum/ds-foundation`**（foundation 層）
  - `@edgescrum/peco-ui` → **`@edgescrum/ds-core`**（core 層）

  プロダクト名をパッケージ名に焼き付けると、プロダクト #2 が
  「PeCo のパッケージを入れる」ことになる。層の名前はオーディエンスにもプロダクトにも依存しない。

  旧名 `@edgescrum/peco-ui` は `1.0.0` から **`ds-core` への再 export shim**として publish し、
  npm 上で deprecate する（移行対象が peco 本体で 172 ファイルあるため）。
  **`1.x` にしたのは `^0.4.0` から自動で上がらないようにするため** —— shim を走査しても
  Tailwind のクラス文字列は見つからないので、`@source` を直さずに上がると見た目だけが静かに壊れる。
  また shim は `ds-core` を **peerDependency** で要求する（dependency にすると
  `pnpm publish` が `workspace:*` を完全一致に置換するため、`ds-core` の自前のコピーを
  連れてきて実体が 2 つ同居する）。

  旧名 `@edgescrum/peco-tokens` には shim を作らない（参照が `@import` 2 行だけで、
  `ds-foundation` と同時に import すると `:root` が二重定義されるため併存させてはいけない）。

  あわせて `repository.url` を `Edgescrum/design-system` に、`homepage` を Storybook の URL にした。

## 0.3.0

### Minor Changes

- f366db2: `radius/control-sm`（0.5rem = `rounded-lg`）を追加。

  角丸の役割トークンは `control`（rounded-xl）と `surface`（rounded-2xl）の 2 段しか無く、
  **実測 208 回の `rounded-lg` に対応する段が無かった**。アイコンボタン（`h-8 w-8` /
  `h-9 w-9`）・チップ・ポップオーバー内の項目・注記ボックスがこの段に当たる。

  Figma で Pagination のページ送りボタンと AppHeader の戻るボタンを作ったときに、
  束縛できる Variable が無く数値直打ちになったのが発覚のきっかけ。

  `rounded-full`（331 回）は Tailwind 標準でそのまま使えるため役割トークンを作らない。
  `rounded-md`（41 回）以下は用途が定まっておらず、収載すると「迷ったら md」の受け皿に
  なるので意図的に外してある。

- ca2bcf0: 5 段評価のスケールをトークン化し、`RatingBadge` を追加（DS#24 の b2・2026-10-06 裁定）。

  ## トークン

  `rating/1` 〜 `rating/5` と `rating/unknown` に `bg` / `fg` / `border` の 3 色（計 18 トークン）。
  値は `red → orange → yellow → green → green(濃)`。

  **`positive` / `warning` / `danger` とは別物で、互いに置き換えない。** あちらは
  「良い・注意・危険」の 3 状態、こちらは 1〜5 の連続スケールで、3 色に潰すと
  隣り合う段（2 と 3、4 と 5）の見分けがつかなくなる。そのため橙（2 段目）と
  黄（3 段目）を**スケール専用に**プリミティブへ収載した。**この 2 色をスケール以外に流用しないこと。**

  新規プリミティブ: `orange/50·100·600`、`yellow/50·100·700`、`green/100`、`gray/600`。

  ## `RatingBadge`

  peco の `review-management-client.tsx` と `customers/[id]/customer-detail-client.tsx` に
  **バイト単位で同一**の実装が `DriverBadge` / `SurveyDriverBadge` という別名で入っていたため、
  寄せ先を部品として用意した。`ratingToneClass(value)` も export している
  （グラフの帯など、バッジ以外で同じスケールを使うとき用）。

  1〜3 と範囲外は peco の旧実装と同値（画素差分なし）。**4・5 は emerald → green の統一で色が変わる**
  （同裁定の A）。

### Patch Changes

- 117029c: プリミティブに `color/gray/300` を追加。Toggle の OFF 状態（`bg-gray-300`）が実装で使われているのにトークン未収載だった（2026-10-05 の Figma 化で判明）。

## 0.2.0

### Minor Changes

- bd8332a: Button に `danger-outline` / `danger-text` variant を追加（#11 裁定・2026-10-04）。peco の DangerZone 4 役割システム（トリガー / 確定 / 取消 / テキスト）を DS Button で完全移行できるようにする。tokens にはトリガーの枠線用セマンティックトークン `color/danger-border`（= red.200）を追加。

### Patch Changes

- 53fa092: Figma 同期が dimension トークン（radius/* text/*）を FLOAT Variable として配信するように修正（従来は色のみで、数値トークンが Figma に存在しなかった）。rem は ×16 で px 換算。

## 0.1.0

### Minor Changes

- acae5fa: 2026-09-27 監査に基づくトークン拡張: ステータス色のセマンティック層（danger / warning / positive / info / on-accent + 各 -bg）、ステータス系プリミティブ（Tailwind v4 oklch 実値）、text/2xs・3xs、radius/control・surface を追加。既存 10 変数は名前・値とも不変。

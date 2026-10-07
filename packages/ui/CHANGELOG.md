# @edgescrum/ds-core（旧 @edgescrum/peco-ui）

## 0.6.0

### Minor Changes

- 6676456: ページの骨格の部品 `PageBody` / `AppBar` / `CenteredNotice` を足し、`PageTabBar` に `placement` を足す（ADR 0027 段 0）

  シェル自体はプロダクトが持ち、DS は部品とトークンだけを持つ（ADR 0027 Decision 1）。

  - **`PageBody`** — `<main>` と本文の余白の**唯一の持ち主**。余白は `space.page.*` で、**`className` を受け取らない**（ページが余白を書けたことがコピーとずれの発生源だったため）。`width`（`"none"` 既定 / `admin` / `narrow` / `flow` / `wide` / `lp`）・`fill`（`flex-1`）・`data-*` の素通し
  - **`AppBar`** — sticky ヘッダー。peco の `CustomerPageHeader` と同じクラス列（左右余白だけトークン）。`back` / `title`（h1）か `logo` / `right` / `width`（既定 `flow`）/ `className`（`<header>` のレスポンシブ出し分け専用）。戻るボタンのクラスは `APP_BAR_BACK_CLASS`（DS は `next/link` を import できないので、リンクはプロダクトが渡す）
  - **`CenteredNotice`** — 行き止まりの状態表示。自分で `<main>` を描く。`title` / `description` / `note` / `icon` / `logo` / `actions` / `className`（**最小の高さ専用**。`min-h-app` は peco 固有なので DS は書かない）
  - **`PageTabBar` の `placement`** — 既定 `"above-body"` は**DOM も見た目も従来と 1 バイトも変わらない**（`verify.mjs` が描画して比べる）。`"in-body"` は `PageBody` の中に置き、**自分の下の余白（`pb-4 sm:pb-6`）を持つ**。ページの `pt-4 sm:pt-6` の代償が要らなくなる
  - `CONTENT_WIDTH_CLASS` / `ContentWidth` — `PageBody` と `AppBar` が共有する幅の表

  ★ 新しいクラス（`py-page-block` / `max-w-content-*` など）は `@edgescrum/ds-foundation` の
  この版の `theme.css` が定義する。**ds-foundation を上げずに ds-core だけ上げると、余白と幅が黙って消える**
  （Tailwind は未知のクラスを無視し、型エラーもビルドエラーも出ない）。

  ★ `@edgescrum/ds-foundation >=0.6.0` を **peerDependency** にした。`PageBody` / `AppBar` / `CenteredNotice` の
  `py-page-block` / `max-w-content-*` などは ds-foundation の `theme.css` が定義するユーティリティで、
  ds-core だけを上げて ds-foundation を据え置くと**クラスが生成されず余白と幅が黙って消える**（ビルドも型も緑のまま）。
  範囲を `^` ではなく `>=` にしたのは、ds-foundation の minor のたびに changesets が ds-core を major に上げないため
  （`onlyUpdatePeerDependentsWhenOutOfRange` と同じ理由）。

## 0.5.0

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

## 0.4.0

### Minor Changes

- 181b4ab: ブランドマークを共通層から外す（ADR 0026 / 2026-10-06）

  **破壊的変更**: `FullScreenLoading` に **`logo` が必須**になり、`PecoLogo` の export を**削除**した。

  ```diff
  - <FullScreenLoading />
  + <FullScreenLoading logo={<PecoLogo aria-label="PeCo" className="mx-auto h-10" />} />
  ```

  ```diff
  - import { PecoLogo } from "@edgescrum/peco-ui";
  + import { PecoLogo } from "@/components/icons/PecoLogo";   // product 層
  ```

  ## なぜ

  `FullScreenLoading` が `<PecoLogo aria-label="PeCo" className="mx-auto h-10" />` を
  **直描きしていた**。共通層にプロダクト #1 のブランドマークが焼き付いている状態で、
  2 つめのプロダクトがこの部品を使うと**そのプロダクトの読み込み画面に PeCo のロゴが出る**。

  変更理由がブランドにあるもの（= ロゴ）は共通層に置けるが、**「どのブランドか」は
  product 層が決める**（ADR 0026 の Decision 2）。

  ## `logo?:` （省略可能）にしなかった理由

  省略可能だと、渡し忘れた呼び出しが**型エラーにならずロゴが消えるだけ**になる。
  ブランドマークの欠落は壊れた見た目として現れないので気づけない。
  **必須にして、出さない画面は `logo={null}` と明示させる。**

  ## 画素への影響

  **無し。** peco の `src/components/icons/PecoLogo.tsx` と DS が持っていた写しは
  **バイト単位で同一**（8933 文字）だったことを実測した。
  `aria-label` → `className` の順で渡せば DOM も 1 文字変わらない
  （`PecoLogo` は `{...props}` を展開するので React は渡した順に属性を吐く）。

  ## 0.x で minor にした理由

  0.x では `^0.3.0` は 0.4.0 に上がらないため、minor が実質的な破壊的変更の channel になる。
  消費側は `^0.4.0` への明示的な bump が必要で、**黙って壊れることはない**。

## 0.3.0

### Minor Changes

- 0a23d1b: `ChevronDownIcon` を追加し、アイコンの出どころを `icons.tsx` に一本化（#21）。

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

## 0.2.1

### Patch Changes

- aafc241: Alert の warning をトークン色に統一（2026-10-04 裁定）。orange-50/700 はパレット外（セマンティックの warning = amber と不一致）だったため、`bg-warning-bg text-warning`（amber-50 / amber-700）に揃える。視覚差分あり: warning Alert の橙 → 琥珀。Figma ライブラリ側は同日に変数束縛済み。

## 0.2.0

### Minor Changes

- bd8332a: Button に `danger-outline` / `danger-text` variant を追加（#11 裁定・2026-10-04）。peco の DangerZone 4 役割システム（トリガー / 確定 / 取消 / テキスト）を DS Button で完全移行できるようにする。tokens にはトリガーの枠線用セマンティックトークン `color/danger-border`（= red.200）を追加。

## 0.1.0

### Minor Changes

- 84f2471: Button（8 variant × 3 size・buttonClass ヘルパー付き）と Badge（6 tone × 3 variant × 2 size・ドット対応）を追加。2026-09-27 監査の実測分類の正規化。
- 610291a: コア部品 11 種 + アイコン 24 個を peco 本体から昇格

  - Spinner / Alert / PageContainer / FormField（FormLabel・FormInput・FormTextarea）/ StepProgress / Pagination（getPaginationRange・DEFAULT_PAGE_SIZE）/ SheetActions（SHEET_ACTIONS_CLASS・sheetActionsClass）/ Toggle / NumberField / FullScreenLoading
  - アイコン 23 個（icons.tsx）+ PecoLogo を icons.tsx に統合。API は全て `SVGProps<SVGSVGElement>` ベースに統一（旧 `size` prop は `width` / `height` の既定値として保持。svg パス・viewBox・既定サイズの見た目は不変）
  - クラス文字列・マークアップ構造・設計コメントは peco 本体から 1 文字も変えていない（アイコン API 統一のみ例外）

- bc9a967: Modal（useDialogBehavior 込み）/ SelectDropdown（useIsDesktop 込み）/ Tabs（TabBar・PageTabBar・TabList・TabButton・TabUnderline。TabLink は Next.js 密結合のためアプリ側に残す）/ TabFilter を昇格。

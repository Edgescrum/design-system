---
"@edgescrum/ds-foundation": minor
"@edgescrum/ds-core": minor
---

パッケージ名を層の名前に改める（ADR 0026 作業 4）

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

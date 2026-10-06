---
"@edgescrum/peco-ui": minor
---

ブランドマークを共通層から外す（ADR 0026 / 2026-10-06）

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

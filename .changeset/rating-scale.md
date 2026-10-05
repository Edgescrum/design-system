---
"@edgescrum/peco-tokens": minor
"@edgescrum/peco-ui": minor
---

5 段評価のスケールをトークン化し、`RatingBadge` を追加（DS#24 の b2・2026-10-06 裁定）。

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

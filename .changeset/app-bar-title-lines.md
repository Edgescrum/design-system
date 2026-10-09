---
"@edgescrum/ds-core": minor
---

`AppBar` に `titleLines`（`1 | 2`・既定 `1`）を足す（Edgescrum/peco#2572）

- **既定（未指定 / `1`）は DOM が 1 バイトも変わらない**（`<h1 class="min-w-0 flex-1 truncate text-base font-semibold">`。`verify.mjs` が描画して比べる）
- **`2`** は画面名を最大 2 行で折り返し、溢れたら 2 行目の末尾で省略する。`<h1 class="min-w-0 flex-1 line-clamp-2 text-base font-semibold leading-tight">`。事業主画面のモバイルヘッダー（peco #948 ②）用で、peco の旧 `<h1 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold leading-tight">` と同じクラスの集合
- 型 `AppBarTitleLines` を export する。`logo` を渡す形では `titleLines` は指定できない（`never`）

★ peco 側は `title` に渡している `<span className="line-clamp-2 whitespace-normal leading-tight">` を外し、`titleLines={2}` に置き換える。

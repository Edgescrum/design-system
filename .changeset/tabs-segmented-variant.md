---
"@edgescrum/ds-core": minor
---

Tabs 系に `variant="segmented"` を追加（#60）。同じ中身の「見方・立場」を 2〜3 択で切り替える角丸の枠 + 塗りの見た目。

- `TabList`: `variant?: "underline" | "segmented"`（既定 `"underline"`）・`size?: "sm" | "md"`（既定 `"md"`）・`fullWidth?: boolean`。`TabButton` は Context から読む
- `TabBar`（リンク版）: `variant` / `fullWidth`。子の `TabLink` は `tabItemClass(isActive, "segmented", { size, fullWidth })` で同じ見た目を組む
- `TabFilter`: `variant` / `size` / `fullWidth` をそのまま `TabList` に渡す
- `tabItemClass(isActive, variant?, options?)`: 第 2・第 3 引数を追加
- 型 `TabVariant` / `TabSize` / `TabSegmentedOptions` を export
- 既定（`"underline"`）の DOM・クラスは 1 バイトも変わらない（`verify:tabs` が追加前の文字列で固定）
- 使い方の約束 `Tabs.design.md` を追加（下線型 = 中身の切り替え / セグメント型 = 見方・立場の 2〜3 択）

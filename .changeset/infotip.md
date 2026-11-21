---
"@edgescrum/ds-core": minor
---

InfoTip を追加（#53・peco 25_design-system.md §10-10）。ラベル・見出しの横の i マーク（`<button>`・`aria-label`「<label> の説明」・`aria-expanded`）と、押すと出る説明のポップアップ（`role="dialog"` ではなく `aria-controls` / `aria-describedby` で関連付け）。外側を押す・Esc・もう一度押す・ポップアップ自体を押すと閉じ、同時に開くのはページ全体で 1 つ。Modal の中では Esc が InfoTip だけを閉じる。中身は文字列だけ（`children: string`）。アイコン `InfoIcon`（Lucide info・16px）も export する。部品の約束は `InfoTip.design.md`。

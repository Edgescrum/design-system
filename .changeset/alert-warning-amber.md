---
"@edgescrum/peco-ui": patch
---

Alert の warning をトークン色に統一（2026-10-04 裁定）。orange-50/700 はパレット外（セマンティックの warning = amber と不一致）だったため、`bg-warning-bg text-warning`（amber-50 / amber-700）に揃える。視覚差分あり: warning Alert の橙 → 琥珀。Figma ライブラリ側は同日に変数束縛済み。

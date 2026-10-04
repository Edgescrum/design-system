# @edgescrum/peco-ui

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

# @edgescrum/peco-ui

## 0.1.0

### Minor Changes

- 84f2471: Button（8 variant × 3 size・buttonClass ヘルパー付き）と Badge（6 tone × 3 variant × 2 size・ドット対応）を追加。2026-09-27 監査の実測分類の正規化。
- 610291a: コア部品 11 種 + アイコン 24 個を peco 本体から昇格

  - Spinner / Alert / PageContainer / FormField（FormLabel・FormInput・FormTextarea）/ StepProgress / Pagination（getPaginationRange・DEFAULT_PAGE_SIZE）/ SheetActions（SHEET_ACTIONS_CLASS・sheetActionsClass）/ Toggle / NumberField / FullScreenLoading
  - アイコン 23 個（icons.tsx）+ PecoLogo を icons.tsx に統合。API は全て `SVGProps<SVGSVGElement>` ベースに統一（旧 `size` prop は `width` / `height` の既定値として保持。svg パス・viewBox・既定サイズの見た目は不変）
  - クラス文字列・マークアップ構造・設計コメントは peco 本体から 1 文字も変えていない（アイコン API 統一のみ例外）

- bc9a967: Modal（useDialogBehavior 込み）/ SelectDropdown（useIsDesktop 込み）/ Tabs（TabBar・PageTabBar・TabList・TabButton・TabUnderline。TabLink は Next.js 密結合のためアプリ側に残す）/ TabFilter を昇格。

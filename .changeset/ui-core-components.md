---
"@edgescrum/peco-ui": minor
---

コア部品 11 種 + アイコン 24 個を peco 本体から昇格

- Spinner / Alert / PageContainer / FormField（FormLabel・FormInput・FormTextarea）/ StepProgress / Pagination（getPaginationRange・DEFAULT_PAGE_SIZE）/ SheetActions（SHEET_ACTIONS_CLASS・sheetActionsClass）/ Toggle / NumberField / FullScreenLoading
- アイコン 23 個（icons.tsx）+ PecoLogo を icons.tsx に統合。API は全て `SVGProps<SVGSVGElement>` ベースに統一（旧 `size` prop は `width` / `height` の既定値として保持。svg パス・viewBox・既定サイズの見た目は不変）
- クラス文字列・マークアップ構造・設計コメントは peco 本体から 1 文字も変えていない（アイコン API 統一のみ例外）

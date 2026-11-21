---
"@edgescrum/ds-core": minor
---

重複の整理画面（peco 要件 27 §7）に要る部品を足す（#56）。

- **BottomSheet**（新部品）: 画面の下端から出るシート。`role="dialog"`・`aria-modal`、名前は見出しの `title`（`aria-labelledby`）。開くとシートへフォーカス・Escape と背景タップで `onClose`・Tab はシートの中で折り返し・閉じたら呼び出し元へ戻す（Modal と枠を共有）。入る / 出るは `motion.transition.sheet-enter` / `sheet-exit`、動きを減らす設定では透明度と暗転面の色だけ（`motion.duration.feedback`）。閉じる動きのあいだは DOM に残るが `inert`。スマホは画面幅・広い画面は `size.content.flow-compact`・高さは画面の 9 割まで。
- **Alert の押せる行**: `href`（`linkComponent` で `next/link` の `Link` を渡せる）または `onClick` を渡すと、行全体が 1 つのリンク / ボタンになり右端に › が出る。live region（`role="status"` / `"alert"`）は外側の箱のまま、名前は本文。押せる行の中身は文字列だけ（型で止める）。`href` / `onClick` を渡さない Alert の DOM は変わらない。
- **Modal**: BottomSheet と共有する枠（暗転面・aria 属性・ダイアログの振る舞い・portal）に載せ替えた。DOM と振る舞いは変わらない（`position="bottom"` は従来どおり中央に出る）。
- 約束: `BottomSheet.design.md` を追加。`Alert.design.md`（押せる行の use_when / never）・`Modal.design.md`（下から出すなら BottomSheet）・DESIGN.md の索引を更新。

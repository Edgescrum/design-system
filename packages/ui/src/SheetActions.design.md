# SheetActions

モーダル・シートの操作行（送信・取り消し）を `sticky bottom-0` でスクロール領域の下端に貼り付ける。はみ出さないときは通常の位置のまま。ボタン 1 個の行は要素を増やさない `sheetActionsClass()` を使う。

- purpose: ソフトキーボードでモーダルが縮んでも、送信と取り消しを押せる位置に残す
- use_when:
  - 入力欄のあるモーダル・シートの操作行（送信・取り消しのボタンを並べた行）
  - ボタン 1 個だけの操作行（`sheetActionsClass()` をそのボタンの className に足す）
  - `bg-background` の入れ子パネルの中の操作行（`surface="background"`）
  - ボタン自身が不透明な背景を塗っている操作行（`surface="self"`）
- dont_use_when:
  - ボタン 1 個を div で包んで貼り付けたい → `sheetActionsClass()` をボタンに足す（包むとマージンの相殺で高さが変わる）
  - ページ本文のフォームの末尾の保存ボタン → Button をフォームの末尾に置く
  - 一覧の行・カードの中の操作 → Button
  - 操作行の中身そのもの → Button（SheetActions は並べる行だけを持つ）
- never:
  - 貼り付けを作り直さない（`@edgescrum/ds-core` の SheetActions / sheetActionsClass を import する）
  - `sticky bottom-0` と背景色を呼び出し側に書き写さない
  - 開いた時点の高さを px で固定してボタンを押せるようにしない（ヘッダーと閉じるが画面外へ出る）
  - `surface` に、操作行が乗っている面と違う色を選ばない
  - ボタン自身が背景を塗っているのに `card` / `background` を選ばない（`self` を渡す）
  - className に配置（余白・`flex`・`gap`）以外を渡さない
  - 操作行の上の余白に任意の値を渡さない（`mt-group` などの余白の用途トークンを使う）
  - 操作行のボタンのラベルを 16 字を超えて書かない
- limits:
  - button_chars: 16
- check: evaluator
- decided_by: peco docs/v2/requirements/25_design-system.md §10-2 / §10-8・peco #1691（キーボードで縮むモーダル）・peco #1690（角丸の差分の実測）・docs/adr/0032-ai-readable-usage-contracts-live-next-to-tokens-and-parts.md

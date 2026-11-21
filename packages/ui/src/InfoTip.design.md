# InfoTip

ラベル・見出しの直後に置く i マーク（`<button>`）と、押すと出る説明のポップアップ。トリガーの名前は「`label` の説明」、開閉は `aria-expanded`、ポップアップは `aria-controls` / `aria-describedby` で指す（`role="dialog"` ではない）。外側を押す・Esc・もう一度押す・ポップアップ自体を押すと閉じ、同時に開くのはページ全体で 1 つ。中身は文字列だけを受け取る。

- purpose: 補足 1 文に入らない例外・副作用・背景を、ラベル横の i マークを押したときだけ出す（段階的表示の 2 段目）
- use_when:
  - 入力欄・設定の行の補足 1 文（40 字）に入らない例外・副作用・背景を足す
  - 画面冒頭やカードの説明を 1 文に削ったときの残り
  - 見出し・ラベルの意味を補う 3 文までの説明
- dont_use_when:
  - 1 文・40 字に収まる補足 → 入力欄・設定の行の下に補足 1 文（`text-role-help`）で出す
  - 常に見えている必要がある注意（友だち追加していないと届かない 等）→ 画面に補足 1 文か Alert（`type="warning"`）で出す
  - エラー・送信の結果 → Alert
  - 入力の必須条件・形式 → FormLabel の `required` と入力欄の下の補足 1 文
  - 取り消せない操作の注意 → 確定ボタンの直前の Alert（`type="warning"`）か Modal の確認
  - 説明の中に操作（ボタン・リンク・設定の切り替え）が要る → 操作を画面に出す
  - 3 文を超える説明・手順・規約 → 1 文に削る。それでも要るならヘルプのページへ
  - アイコンだけのボタンの名前をホバーで見せたい → ボタンに見える文字か `aria-label` を付ける
- never:
  - i マークとポップアップを作り直さない（`@edgescrum/ds-core` の InfoTip を import する。InfoIcon とボタンを手で組まない）
  - ホバーで開かない。開閉を呼び出し側の state で持たない（押して開く・閉じ方は部品が持つ）
  - ポップアップの中にボタン・リンク・入力欄を入れない
  - ポップアップの中にさらに i マークを置かない
  - 中身を 3 文を超えて書かない
  - 常に見えている必要がある注意・エラー・入力の必須条件を中に隠さない
  - 補足の文の末尾に置かない（ラベル・見出しの直後の同じ行に置く）
  - FormLabel（`<label>`）の中に入れない（入力欄の名前に「の説明」が混ざる）。ラベルの外の同じ行に並べる
  - 1 つのラベル・見出しに 2 つ以上置かない
  - `label` に横のラベル・見出しと違う文言を渡さない
  - アイコンの大きさ・押せる範囲・色・影・角丸・動きを className や style で変えない
- limits:
  - content: 3文まで・操作なし
  - per_label: 1
  - nesting: ポップアップの中に i マークを置かない
  - icon: 16px・押せる範囲 44px 四方
  - motion: motion.duration.surface（250ms）・productive enter / exit。動きを減らす設定では透明度だけ（motion.duration.feedback）
- check: evaluator
- decided_by: peco docs/v2/requirements/25_design-system.md §10-10 / §10-8・Edgescrum/design-system #53・docs/adr/0032-ai-readable-usage-contracts-live-next-to-tokens-and-parts.md

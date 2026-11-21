# Toggle

押した瞬間に `onChange(!checked)` を呼ぶスイッチ（`role="switch"`）。ラベルも補足も描かないので、行のラベルと対で置く。

- purpose: 1 つの設定のオン / オフを、押した瞬間に切り替える
- use_when:
  - 押した瞬間に反映してよい 2 択の設定（通知・受付・公開のオン / オフ）
  - 設定の行の右端に、行のラベルと対で置く
- dont_use_when:
  - 保存ボタンを押すまで反映しないフォームの中の選択 → フォームの選択肢（SelectDropdown 等）を使い、送信で反映する
  - 切り替えると課金・削除・お客さまへの通知が起きる → Button で操作し、Modal で確認してから実行する
  - 選択肢が 3 つ以上・選択肢に名前がある（月額 / 年額 等）→ SelectDropdown か TabFilter
  - 操作を実行する（送信・取り消し）→ Button
- never:
  - トグルを作り直さない（独自の switch・checkbox の見た目替えを書かない）。`@edgescrum/ds-core` の Toggle を import する
  - トグルの中に文字やアイコン（オン / オフ・✓）を足さない
  - ラベルの無いトグルを置かない（行のラベルか ariaLabel のどちらかを必ず付ける）
  - トグルの下の補足を 1 文・40 字を超えて書かない。超えるならラベル横の i マークのポップアップへ移す（§10-10）
  - 補足に括弧書きで例外や副作用を足さない
  - activeColor にセマンティックの色トークン以外（`bg-[#06C755]`・`bg-green-500` 等）を渡さない
- limits:
  - label_chars: 16
  - help: 1文・40字・括弧なし
- check: evaluator
- decided_by: peco docs/v2/requirements/25_design-system.md §10-2 / §10-8・docs/adr/0032-ai-readable-usage-contracts-live-next-to-tokens-and-parts.md

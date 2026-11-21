# FormField

入力欄 1 つ分の `FormLabel`（ラベル）・`FormInput`（1 行）・`FormTextarea`（複数行）。補足とエラーは描かないので、補足は入力欄の下に 1 文で置く。

- purpose: 打って入力する欄 1 つに、タップで入力欄へ移るラベルを付けて置く
- use_when:
  - 氏名・店舗名・電話番号・URL など、文字を打って入力させる欄（`FormInput`）
  - メッセージ・メモなど複数行の自由記述（`FormTextarea`）
  - 選択肢のボタンが複数並ぶ群に名前を付ける（`FormLabel` の `id` を `role="group"` / `role="radiogroup"` の `aria-labelledby` で指す）
- dont_use_when:
  - 押した瞬間に反映するオン / オフ → Toggle
  - 決まった選択肢から 1 つ選ぶ → SelectDropdown
  - 人数・分数・金額を増減させる → NumberField
  - 送信の結果（保存しました・失敗しました）を出す → Alert
  - 補足が 1 文・40 字に収まらない（条件・例外・副作用の説明が続く）→ 1 文に削り、残りはラベル横の InfoTip（i マークのポップアップ）へ移す
  - 文字数の上限・推奨・「任意」の理由をラベルの括弧書きで足したい → 入力欄の下の補足 1 文に移す
- never:
  - 入力欄とラベルを作り直さない（`@edgescrum/ds-core` の FormLabel / FormInput / FormTextarea を import する）
  - `<input>` / `<textarea>` / `<label>` に同じ見た目のクラスを書き写さない
  - 相手のいない `htmlFor` を書かない（同じ画面に同じ `id` の入力欄を必ず置く）
  - 1 つの FormLabel に `htmlFor` と `id` を併記しない
  - 単一のボタン（SelectDropdown のトリガー等）のラベルを `role="group"` に書き換えない（`htmlFor` で紐付ける）
  - ラベルの見た目を className で上書きしない（`!text-xs`・`!font-normal`・`!text-muted` 等）
  - 必須の印を自前で足さない（`required` を渡す）
  - placeholder をラベルの代わりにしない
  - ラベルを 16 字を超えて書かない
  - 補足を 1 文・40 字を超えて書かない。PC だけに出す補足でも 2 文・80 字まで
  - 補足に括弧書きで例外・上限・推奨を足さない
  - 補足の文字サイズ・太さを直書きしない（`text-role-help`・`font-regular` を使う）
- limits:
  - label_chars: 16
  - help: 1文・40字・括弧なし
  - help_pc_only: 2文・80字
  - help_in_disclosure: 3文まで
- check: evaluator
- decided_by: peco docs/v2/requirements/25_design-system.md §10-2 / §10-8・peco #1429 / #1461 / #1875（htmlFor と id の使い分け）・docs/adr/0032-ai-readable-usage-contracts-live-next-to-tokens-and-parts.md

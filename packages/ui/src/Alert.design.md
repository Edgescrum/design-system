# Alert

送信の結果・操作の直前の注意を 1 文で出す箱。`error` は `role="alert"`（割り込んで読まれる）、`success` / `warning` は `role="status"`。見出し・アイコン・ボタンは描かない。`href`（または `onClick`）を渡すと**行全体が 1 つのリンク / ボタン**になり右端に › が出る（live region は外側の箱のまま・名前は本文・中身は文字列だけ）。

- purpose: 送信の結果や、操作の前に知っておくべき注意を 1 文で知らせる
- use_when:
  - Server Action の失敗理由（`type="error"`。結果だけが描く目印として `data-testid` を付ける）
  - 保存・発行・再発行の成功（`type="success"`）
  - 戻せない・お客さまに影響する操作の直前の注意（`type="warning"`。確認モーダルの中を含む）
  - 一覧の上のお知らせから、対応する画面へ進ませる（`href`。行全体が 1 つのリンクになり右端に ›。peco では `linkComponent={Link}`）
  - お知らせを押して、その場でシートを開く（`onClick`。行全体が 1 つのボタン）
- dont_use_when:
  - 機能・画面・設定の説明を段落で書く → 1 文に削り、残りはラベル横の InfoTip（i マークのポップアップ）へ移す
  - 見出しと本文の 2 段・箇条・次の操作のボタンを中に入れたい → 1 文に削る。残る状態説明はカードに置く（Card 部品は作成中・peco 25_design-system.md §10-6）
  - error / success / warning のどれでもないお知らせ・ヒント → 入力欄や設定の補足 1 文（`text-role-help`）
  - 状態の名前（公開中・未払い・招待中）を示す → Badge
  - 読み込み中 → Spinner / FullScreenLoading
  - 画面全体が使えない（権限が無い・見つからない・期限切れ）→ CenteredNotice
  - 押す前に確認を取る → Modal で確認する
  - お知らせの中に操作のボタンを並べたい（確認する・閉じる・あとで）→ 行全体を押せる形（`href` / `onClick`）にして操作は 1 つにする
  - 押せる一覧の 1 行（名前・件数・状態を並べる）→ 一覧の行（peco の手書きの行。DS の部品は未作成）
- never:
  - 結果表示の箱を作り直さない（`@edgescrum/ds-core` の Alert を import する）
  - `bg-red-50` / `bg-amber-50` 等の色付きの箱に `role="alert"` を書いて代わりにしない
  - Alert を `role="alert"` / `role="status"` の要素で包まない（読み上げが 2 回になる）
  - Alert に `aria-live` を足さない
  - type に無い種類の色（info・orange・青）を作らない
  - 中身を 1 文・40 字を超えて書かない
  - 中身に括弧書き（件数・例外・補足）を足さない
  - 中身に見出し・箇条・ボタン・リンクを入れない（行全体を押せるようにするときは `href` / `onClick` を渡す。部品が行を 1 つのリンク / ボタンにする）
  - 押せる行に `role` を書き足さない・リンクやボタンで Alert を包まない（live region は部品の外側の箱だけ）
  - 押せる行を 1 つの画面に 2 つ以上並べない（お知らせは 1 件。件数は文言に入れる）
  - 押すと何の画面へ進むかが文言から分からない押せる行を作らない
  - › を手で足さない・別のアイコンに差し替えない
  - 中身の文字サイズ・太さを変えない（`font-bold` の span・`text-xs` の span を入れない）
- limits:
  - text: 1文・40字・括弧なし
  - pressable_per_screen: 1
- check: evaluator
- decided_by: peco docs/v2/requirements/25_design-system.md §10-2 / §10-8・peco #1165（role の持たせ方）・peco 27_pending-customer-claim-and-merge.md §6-1 / §7 と Edgescrum/design-system #56（押せる行）・peco ADR-0011（data-testid）・docs/adr/0032-ai-readable-usage-contracts-live-next-to-tokens-and-parts.md

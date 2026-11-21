# Alert

送信の結果・操作の直前の注意を 1 文で出す箱。`error` は `role="alert"`（割り込んで読まれる）、`success` / `warning` は `role="status"`。見出し・アイコン・ボタンは描かない。

- purpose: 送信の結果や、操作の前に知っておくべき注意を 1 文で知らせる
- use_when:
  - Server Action の失敗理由（`type="error"`。結果だけが描く目印として `data-testid` を付ける）
  - 保存・発行・再発行の成功（`type="success"`）
  - 戻せない・お客さまに影響する操作の直前の注意（`type="warning"`。確認モーダルの中を含む）
- dont_use_when:
  - 機能・画面・設定の説明を段落で書く → 1 文に削り、残りはラベル横の InfoTip（i マークのポップアップ）へ移す
  - 見出しと本文の 2 段・箇条・次の操作のボタンを中に入れたい → 1 文に削る。残る状態説明はカードに置く（Card 部品は作成中・peco 25_design-system.md §10-6）
  - error / success / warning のどれでもないお知らせ・ヒント → 入力欄や設定の補足 1 文（`text-role-help`）
  - 状態の名前（公開中・未払い・招待中）を示す → Badge
  - 読み込み中 → Spinner / FullScreenLoading
  - 画面全体が使えない（権限が無い・見つからない・期限切れ）→ CenteredNotice
  - 押す前に確認を取る → Modal で確認する
- never:
  - 結果表示の箱を作り直さない（`@edgescrum/ds-core` の Alert を import する）
  - `bg-red-50` / `bg-amber-50` 等の色付きの箱に `role="alert"` を書いて代わりにしない
  - Alert を `role="alert"` / `role="status"` の要素で包まない（読み上げが 2 回になる）
  - Alert に `aria-live` を足さない
  - type に無い種類の色（info・orange・青）を作らない
  - 中身を 1 文・40 字を超えて書かない
  - 中身に括弧書き（件数・例外・補足）を足さない
  - 中身に見出し・箇条・ボタン・リンクを入れない
  - 中身の文字サイズ・太さを変えない（`font-bold` の span・`text-xs` の span を入れない）
- limits:
  - text: 1文・40字・括弧なし
- check: evaluator
- decided_by: peco docs/v2/requirements/25_design-system.md §10-2 / §10-8・peco #1165（role の持たせ方）・peco ADR-0011（data-testid）・docs/adr/0032-ai-readable-usage-contracts-live-next-to-tokens-and-parts.md

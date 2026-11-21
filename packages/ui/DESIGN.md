---
# 生成物（DTCG と package.json から build が書き込む）。手で編集しないこと。
version: "alpha"
name: "@edgescrum/ds-core"
description: "Edgescrum design system — core layer. Audience-agnostic React components (Tailwind CSS v4). Consumers must include this package in Tailwind's @source scan."
---
# @edgescrum/ds-core

全オーディエンス（事業主 / お客さま / 未ログイン訪問者）に共通の React 部品の層。
部品ごとの使い方の約束は部品の隣の `<部品名>.design.md` にあり、下の索引から `@path` で辿る。
値（色・文字・余白）は `@edgescrum/ds-foundation` の DESIGN.md が正。

## Never（このパッケージ全体）

- 部品は `@edgescrum/ds-core` から import する。作り直さない。
- 部品の見た目を className や style で上書きしない。足りないときは部品の props を足す PR を DS に出す
- 約束にない新しい部品を作らない。どの `dont_use_when` の矢印の先にも当てはまらなければ、作らずに止めて運用者に上げる
- オーディエンス固有の部品（`_admin` / `_consumer` / `_marketing`）を core から import しない
- 業務の概念（予約・プラン・店舗）を部品に持ち込まない。それはプロダクト側に置く

## 部品の索引

- Alert — 送信の結果や、操作の前に知っておくべき注意を 1 文で知らせる → `@src/Alert.design.md`
- Button — 押すと 1 つの操作（送信・保存・確定・取り消し・開く）を実行する → `@src/Button.design.md`
- FormField — 打って入力する欄 1 つに、タップで入力欄へ移るラベルを付けて置く → `@src/FormField.design.md`
- InfoTip — 補足 1 文に入らない説明を、ラベル横の i マークを押したときだけ出す → `@src/InfoTip.design.md`
- Modal — 応えるまで先へ進めない確認や短い入力を、画面の上に重ねて出す → `@src/Modal.design.md`
- SheetActions — ソフトキーボードでモーダルが縮んでも、送信と取り消しを押せる位置に残す → `@src/SheetActions.design.md`
- Toggle — 1 つの設定のオン / オフを、押した瞬間に切り替える → `@src/Toggle.design.md`

約束が未記入の部品は `@design-md-baseline.json` に記録してある（減ることしか許さない）。
書く順は peco `docs/v2/requirements/25_design-system.md` §10-6 の 5（文字が多くなりやすい部品から）。

## Decided by

peco `docs/v2/requirements/25_design-system.md` §10 と
`docs/adr/0032-ai-readable-usage-contracts-live-next-to-tokens-and-parts.md`。

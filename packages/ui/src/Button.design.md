# Button

押すと 1 つの操作を実行するボタン（既定 `type="button"`）。variant 10 種・size 3 種（md で高さ 44px）。`<Link>` / `<a>` にボタンの見た目を与えるときは `buttonClass()` を使う。

- purpose: 押すと 1 つの操作（送信・保存・確定・取り消し・開く）を実行する
- use_when:
  - フォームの送信・保存、モーダルの確定と取り消し（`type="submit"` は明示する）
  - 画面の主操作（`primary`。モバイルの主操作は `size="lg"`・`fullWidth`）
  - 主操作と並ぶ控えめな操作（`secondary` / `outline` / `soft` / `ghost`）
  - 戻せない操作（入口は `danger-outline`・確認の確定は `danger`・取り消しは `secondary`・目立たせない入口は `danger-text`）
  - LINE の友だち追加・LINE で開く・LINE でログイン（`success`）
  - 別の画面へ移るリンクをボタンの見た目にする（`buttonClass()` を `<Link>` / `<a>` に渡す）
- dont_use_when:
  - 戻せない操作を 1 回押しで実行する → `danger-outline` で入口を置き、Modal で確認してから `danger` で実行する
  - 設定のオン / オフを押した瞬間に切り替える → Toggle
  - 一覧の絞り込み・表示の切り替え → TabFilter / Tabs
  - 状態の名前を示すだけで押せない → Badge
  - LINE 以外の成功・肯定の操作に緑を使いたい → `primary`
  - ラベルが 16 字を超える → 動詞を含む 16 字以内に削り、条件はボタンの上の補足 1 文に移す
  - `<button>` の中に別の画面へ移る処理だけを書く → `buttonClass()` を `<Link>` に渡す
- never:
  - ボタンを作り直さない（`@edgescrum/ds-core` の Button / buttonClass を import する）
  - `<button>` / `<a>` に角丸・背景・押下の縮みを書き写さない
  - 見た目を className で上書きしない（色・影・文字の大きさ・太さ・内側の余白。`shadow-lg shadow-accent/25`・`text-base`・`font-bold` 等）
  - `!`（important）で部品のクラスを打ち消さない（`px-0!` 等）
  - className に配置（外側の余白・`flex-1`・幅）以外を渡さない
  - variant に無い色（`bg-red-500`・`bg-[#06C755]` 等）を作らない
  - hover・押下・disabled の表現を自前で足さない
  - タップ領域を縮めない（`min-h` を上書きしない）
  - アイコンだけのボタンを `aria-label` なしで置かない
  - ラベルを 16 字を超えて書かない
  - ラベルに括弧書きを足さない
- limits:
  - label_chars: 16
- check: evaluator
- decided_by: peco docs/v2/requirements/25_design-system.md §10-2 / §10-8・DS docs/audit-2026-09-27.md §1（variant の正規化）・DS #11（danger 系 4 役割・2026-10-04）・docs/adr/0032-ai-readable-usage-contracts-live-next-to-tokens-and-parts.md

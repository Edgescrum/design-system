# Tabs

同じ場所の表示を切り替えるタブ。押すと同じページの中で切り替わる `TabList` + `TabButton`（`role="tablist"` / `role="tab"`）と、押すと URL が変わる `TabBar`（子はアプリ側の `TabLink`。現在地は `aria-current="page"`）の 2 つの入れ物がある。見た目は `variant` で 2 種類: 既定の **下線型**（`"underline"`）と **セグメント型**（`"segmented"`・角丸の枠と選択中の塗り。`size` は `sm` / `md`、`fullWidth` で横幅いっぱい）。ARIA はどちらの見た目でも同じ。

- purpose: 同じ場所に出す中身や、その見方を、ページを離れずに切り替える
- use_when:
  - 中身そのものを切り替える（店舗設定の基本情報 / 外観 / 営業時間・分析・口コミの絞り込み）→ 下線型（既定）
  - 同じ中身の見方や立場を 2〜3 択で切り替える（体験ページのお客さま / 事業主）→ `variant="segmented"`
  - 切り替えで URL が変わる → `TabBar` + アプリ側の `TabLink`（セグメント型なら `TabBar variant="segmented"` と `tabItemClass(isActive, "segmented")`）
  - 切り替えで URL が変わらない → `TabList` + `TabButton`（`variant` は `TabList` にだけ渡す）
  - ページ最上部のリンクのタブ → `PageTabBar`（下線型だけ）
- dont_use_when:
  - 中身を切り替えるタブをセグメント型にしたい → 下線型のまま使う（#893 で絞り込みのピル型を外し、下線型に揃えた）
  - 選択肢が 4 つ以上ある見方の切り替え → 下線型（セグメント型は 2〜3 択まで）
  - 設定のオン / オフを押した瞬間に切り替える → Toggle
  - 保存ボタンを押すまで反映しないフォームの中の選択 → SelectDropdown
  - 押すと操作を実行する（送信・取り消し）→ Button
- never:
  - タブを作り直さない（`role="tablist"` の手組み・ピル型の手組みを書かない）。`@edgescrum/ds-core` の TabList / TabButton / TabBar を import する
  - 同じ役割の切り替えを、画面ごとに下線型とセグメント型で描き分けない
  - `TabButton` を `TabList` の外に置かない（`role="tab"` は `role="tablist"` の親が必須）
  - リンクのタブに `role="tab"` を付けない（現在地は `aria-current="page"`）
  - `TabButton` に見た目を 1 つずつ渡そうとしない。`variant` / `size` / `fullWidth` は `TabList` に渡す
  - セグメント型の色・余白・角丸を className で上書きしない（`bg-[#…]`・`p-[3px]` 等の任意値を書かない）
  - タブのラベルを 16 字を超えて書かない
- limits:
  - label_chars: 16
  - segmented_options: 2〜3
- check: evaluator
- decided_by: DS #60（2026-11-23 運用者裁定: ModeSwitch は新部品にせず Tabs の variant にする）・peco #893（タブの見た目を下線型に一本化）・peco #901（スケジュールの月 / 週は手組みのまま）・peco docs/v2/requirements/25_design-system.md §10-2・docs/adr/0032-ai-readable-usage-contracts-live-next-to-tokens-and-parts.md

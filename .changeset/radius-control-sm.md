---
"@edgescrum/peco-tokens": minor
---

`radius/control-sm`（0.5rem = `rounded-lg`）を追加。

角丸の役割トークンは `control`（rounded-xl）と `surface`（rounded-2xl）の 2 段しか無く、
**実測 208 回の `rounded-lg` に対応する段が無かった**。アイコンボタン（`h-8 w-8` /
`h-9 w-9`）・チップ・ポップオーバー内の項目・注記ボックスがこの段に当たる。

Figma で Pagination のページ送りボタンと AppHeader の戻るボタンを作ったときに、
束縛できる Variable が無く数値直打ちになったのが発覚のきっかけ。

`rounded-full`（331 回）は Tailwind 標準でそのまま使えるため役割トークンを作らない。
`rounded-md`（41 回）以下は用途が定まっておらず、収載すると「迷ったら md」の受け皿に
なるので意図的に外してある。

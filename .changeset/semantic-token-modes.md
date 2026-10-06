---
"@edgescrum/ds-foundation": minor
---

セマンティック層にモード機構を入れる（ADR 0026 作業 3）

判定表の第 3 カテゴリ「構造は共通・値が個別」（管理画面の幅・アクセント色など）の受け皿。
**semantic だけがモードを持ち、primitives は持たない。**

- `modes/<名>.json`（**`tokens/` の外**）に既定との差分を書く
- `dist/css/modes/<名>.css` に `[data-ds-mode="<名>"]` のブロックとして出る
- 既定（`dist/css/tokens.css`）は**モードを 1 つも置かなければ 1 バイトも変わらない**（実測）
- `exports` に `./modes/*` を追加

**実在するモードは 0 件。** プロダクトが PeCo 1 つなので既定で足りる。機構だけ先に
入れたのは semantic が 19 変数の今が最安で、シェル（作業 6）より先でないと
PeCo の寸法が共通層に焼き付くため（ADR の「順序の制約」）。

あわせて検査の土台を入れた（`pnpm verify` / CI）。実行されない経路が黙って壊れた
実例が 2 件あったため:

- **Figma の既定モード名を設定するコードが空のループだった** —— docstring は
  「モード "Light"」と言っていたが実際には名前を一度も設定しておらず、Figma 側は
  既定の "Mode 1" のままだった。モードが 1 本のあいだ誰も困らないので気づけなかった。
  既定モード名を `Base` に揃え、payload の組み立てを純関数（`scripts/figma-payload.mjs`）
  に切り出してネットワーク無しで検査できるようにした
- **モードを `tokens/modes/` に置くと既定の `:root` が上書きされる** ——
  Style Dictionary の source が `tokens/**/*.json` なのでモードが通常のトークンとして
  読まれる。実測で `--accent` が `#f08c79` → `oklch(48.8% 0.243 264.376)` に変わった。
  置き場所を source の外に出し、不変条件を `verify.mjs` が見る

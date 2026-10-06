# `modes/` — セマンティックのモード（ADR 0026 Decision 3）

**実在するモードは現在 0 件。** プロダクトが PeCo 1 つしか無いので、既定値がそのまま
`:root` に出れば足りる。機構だけを先に入れてある（**semantic が 19 変数の今が最安**で、
あとからだと全トークンの書き直しになるため）。

## ★ このディレクトリが `tokens/` の外にある理由

Style Dictionary の source は **`tokens/**/*.json`** なので、モードを `tokens/modes/` に
置くと**モードファイルが通常のトークンとして読まれ、既定の `:root` を上書きする**。

実測（この機構の実装中に踏んだ）: `tokens/modes/acme.json` を置いた瞬間に
`dist/css/tokens.css` の `--accent` が PeCo のサーモン `#f08c79` から
青 `oklch(48.8% 0.243 264.376)` に変わった。

**モードが 0 件のあいだは絶対に起きない。** つまり最初のプロダクトがモードを足した日に
PeCo の既定が壊れる、という形でしか現れない。`verify.mjs` の
`verify:modes-outside-source` がこの不変条件を機械的に見ている。

## モードを足す手順

1. **このディレクトリ**に `<プロダクト名>.json` を作り、**既定と違うキーだけ**を書く

   ```json
   {
     "accent": { "$value": "{color.blue.700}" },
     "accent-dark": { "$value": "{color.blue.900}" }
   }
   ```

   - キーは `color.semantic.json` と同じ綴り（入れ子は `rating.3.fg` のようにドットでも可）
   - **既定に無いキーはビルドが落ちる**（綴り違いが黙って死なないように）
   - **`color.*`（primitives）は書けない** — ADR 0026 Decision 3 が禁止している

2. `pnpm build` → `dist/css/modes/<名>.css` が出る（**既定の `tokens.css` は 1 バイトも変わらない**）

3. 消費側（そのプロダクト）で:

   ```css
   @import "@edgescrum/ds-foundation/css";              /* 既定（全変数） */
   @import "@edgescrum/ds-foundation/modes/<名>.css";   /* 差分のみ */
   ```

   ```html
   <html data-ds-mode="<名>">
   ```

   ★ **属性を立て忘れると既定（PeCo の値）のまま**になる。ブランド色が違うのは
   画面を見れば分かるので、黙って壊れる類ではない。

4. `pnpm verify` の `verify:no-real-modes` が「モード 0 件」を期待しているので、
   **その期待値を更新する**（モードが増えたことを明示的に記録するため、
   自動で通るようにはしていない）

## 既知の限界: モードは 1 軸しかない

ダークモードは**同じコレクションの別モード**になるので、「ブランド × 明暗」の 2 軸が
必要になった時点で**モードの直積**（`acme-light` / `acme-dark` …）かコレクション分割の
判断が要る。Figma の Variables も 1 コレクション = 1 軸なので制約は同じ。
**直積に入る前に ADR を書き直すこと**（組合せが増えると Encore の "spider's web" を再現する）。

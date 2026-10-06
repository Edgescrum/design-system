# `@edgescrum/peco-ui`（非推奨・移行用 shim）

**このパッケージは `@edgescrum/ds-core` に改名した**（ADR 0026）。中身は再 export 1 行だけで、
新しい部品が追加されることはない。**新規の import は `@edgescrum/ds-core` を使うこと。**

存在理由は 1 つだけ: peco 本体に `@edgescrum/peco-ui` の import が **172 ファイル**あり、
それを一度のコミットで書き換えることを DS 側の publish の前提にしないため
（ADR 0026 Consequences 2「165 ファイルを人質にしない」）。

## ★ 使うときの注意 3 点

### 1. Tailwind の `@source` は **`ds-core` を指すこと**

```css
/* 正しい */
@source "../node_modules/@edgescrum/ds-core";

/* 間違い — クラスが 1 つも生成されず、DS 部品の見た目が全部消える */
@source "../node_modules/@edgescrum/peco-ui";
```

Tailwind v4 の `@source` は**ファイルを走査してクラス文字列を集める**仕組みで、
モジュール解決の結果は見ない。このパッケージの `index.js` は再 export 1 行なので、
ここを走査しても `inline-flex` も `rounded-lg` も見つからない。
**型エラーにもビルドエラーにもならず、見た目だけが静かに壊れる。**
import 元が `peco-ui` のままでも `@source` が `ds-core` を向いていれば正しく動く
（走査対象と import 元は独立している）。

### 2. `@edgescrum/ds-core` は **peerDependency**（一緒に入れること）

```jsonc
// 消費側の package.json — 2 つ並べて書く
"@edgescrum/ds-core": "^0.5.0",
"@edgescrum/peco-ui": "^1.0.0"
```

**dependency にしてはいけない。** `pnpm publish` は `workspace:*` を**完全一致**の
バージョンに置き換えるため、dependency だと shim が `ds-core` の**自前のコピー**を連れてくる。
消費側が `ds-core` を単独で上げた瞬間に **2 つの実体が同居し**、
`peco-ui` から import した `Button` と `ds-core` から import した `Button` が
別の実装になる（移行期間 = まさに両方の import が混在している時期に起きる）。
peerDependency なら消費側の 1 つのコピーに必ず解決する。

**★ ただし changesets は既定で「peer 依存が上がったら dependent を major に上げ、
peer の範囲も上げ先に合わせて狭める」。** 実測では `ds-core` 0.4.0 → 0.5.0 の bump で
shim が `1.0.0` → **`2.0.0`** になり、`>=0.4.0` が **`>=0.5.0` に狭められた**（PR #31）。
これでは広い範囲にした意味が無くなり（消費側が `ds-core` を上げるたびに shim も
上げ直すことになる）、非推奨パッケージに無意味な major が積まれる。
`.changeset/config.json` の

```json
"___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": {
  "onlyUpdatePeerDependentsWhenOutOfRange": true
}
```

で「範囲から外れたときだけ上げる」に変えてある。**この行を消すと上の挙動に戻る。**
（JSON にコメントが書けないので理由はここに置く。このキーは `config@3.1.x` の
JSON schema には載っていないが、`@changesets/config` も `assemble-release-plan` も
読んでいる —— 既定値は `false`。）

### 3. バージョンは **1.0.0 から**

最後に publish した実体は `@edgescrum/peco-ui@0.4.0`。shim を `0.4.1` で出すと、
`^0.4.0` で参照している消費者が**何も宣言していないのに** shim へ上がってしまい、
上の `@source` 事故を踏む。`1.0.0` にしてあるので `^0.4.0` は絶対に解決しない
—— shim への移動は消費者が明示的に `^1.0.0` に上げたときだけ起きる。

# 貢献のしかた — 層・minimum bar・昇格

設計判断の正は peco の
[`docs/adr/0026-design-system-layers-are-audience-local-systems.md`](https://github.com/Edgescrum/peco/blob/main/docs/adr/0026-design-system-layers-are-audience-local-systems.md)
と `docs/v2/requirements/25_design-system.md` §9。ここにはその**運用の仕方**だけを書く。

## 層

```
  foundation        トークン（primitives / semantic / component）      ← minimum bar
    └ core          全オーディエンス共通の部品
        └ local     オーディエンス別のシェルとパターン
                      · admin      事業主（管理画面）
                      · consumer   お客さま / LIFF
                      · marketing  未ログイン訪問者
            └ product   情報設計と業務部品（★ DS の層ではない）
```

| 層 | パッケージ | 置き場所 |
|---|---|---|
| foundation | `@edgescrum/ds-foundation` | `packages/tokens/` |
| core | `@edgescrum/ds-core` | `packages/ui/src/` **直下** |
| local | （将来 `@edgescrum/ds-admin` 他） | `packages/ui/src/_admin/` `_consumer/` `_marketing/` |
| product | なし | **各プロダクトのリポジトリ**。DS には置かない |

**ディレクトリ名が `foundation` / `core` ではなく `tokens` / `ui` のままなのは意図的。**
Code Connect のテンプレート 41 本が `// source=packages/ui/src/...` を**実パス**として
参照しているため、改名には 41 本の書き換えが連動する。層の表現はパッケージ名
（`ds-foundation` / `ds-core`）とディレクトリの階層で足りているので、
**名前の二重管理を増やさない**判断（作業 4）。

`_` 接頭辞は「**まだ npm パッケージではない**」印。分割は再 export で無破壊にできるので
可逆。不可逆なのは命名だけ。

### 向き（`eslint.config.mjs` が error にする）

| 層 | import してよい | してはならない |
|---|---|---|
| foundation | （なし） | **core** |
| core | foundation | **local のどれか** |
| local:X | foundation / core | **local:Y（X ≠ Y）** |

向きの定義は **`layers.mjs` が唯一の正**。eslint と `packages/ui/verify.mjs` が同じ 1 つを読む。
**オーディエンスを足すときは `AUDIENCES` に足すだけでよく、片方だけ直ることが起きない。**

## minimum bar

> **Edgescrum の全プロダクトは `@edgescrum/ds-foundation` の使用を必須とする。
> core と local は任意。**

だから **foundation は core に依存してはならない**（依存すると必須の範囲が core まで広がる）。
これは規約ではなく lint で固定してある。

## 「どちらに置くか」の判定

**問いは「これが変わるとき、何が原因か」の 1 つだけ。**

| 変更理由 | 層 | 例 |
|---|---|---|
| ブランド / プラットフォーム | foundation・core | ブランド色・コントラスト基準・日本語組版・Button の padding |
| 業務ドメイン | product | プランが増える・予約の状態が増える・評価軸が変わる・情報設計 |
| **構造は共通・値が個別** | **共通層 + モード** | 管理画面の幅 1280・アクセント色・ロゴ |

第 3 カテゴリの受け皿が**セマンティックのモード**（`packages/tokens/modes/` を参照）。
**共通層に「PeCo の値」を直接書かない** —— 役割トークンを置き、値はモードで差し替える。

## 昇格（local / product → core）

> **2 プロダクト以上で実証されたら昇格する。
> ★ 呼び出し箇所ではなくプロダクトを数える。**

`rating.*`（評価スケール）はこの規則で事前に止まった例: **2 箇所で使われているが
1 プロダクト内**なのでプロダクト数は 1 → core に上げない。

昇格 PR に書くこと:

1. **どの 2 プロダクトで使われているか**（リポジトリ名と具体の呼び出し箇所）
2. **変更理由がブランド / プラットフォーム側であること**（上の判定表のどの行か）
3. **値がプロダクトで違うなら、モードで吸収できているか**（できないなら昇格しない）

逆向き（core → local / product への**降格**）も同じ PR 作法で行う。
誤分類は記録する（§9-7 の計測 4 指標のうち Coverage の誤分類率）。

## 検査

**宣言だけでは守られない。** 「emerald を green に統一する」が
`color.primitives.json` の `$description` に書かれたまま **79 行が 9 日間残った**
実例（peco #2500）があるので、規則はすべて機械検査とセットで入れる。

```bash
pnpm build       # トークンと部品のビルド
pnpm typecheck
pnpm lint        # 層の向き（eslint.config.mjs）
pnpm verify      # トークン 18 本（モード機構・ページ余白 / 本文幅）+ 層の検査 10 本 + ページの骨格 5 本
```

`pnpm verify` は **ESLint を API から呼んで標本コードを食わせる**。
local のディレクトリはまだ空なので、**標本が無いと境界の規則は 1 度も実行されないまま腐る**
（作業 3 で「Figma の既定モード名を付けるコードが空のループだった」のと同型）。
`eslint.config.mjs` の `files:` の綴りを間違えたらここで落ちる。

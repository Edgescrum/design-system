# `_marketing/` — local 層 / オーディエンス: **未ログイン訪問者（LP・公開ページ）**

**まだ空。** 最初の住人は `MarketingShell`（ヘッダー + フッター）で ADR 0026 §9-6 の**作業 6**。

- import してよい: `@edgescrum/ds-foundation` / core（`../*`）
- **してはならない: `_admin/` `_consumer/`**（`eslint.config.mjs` が error にする）
- 昇格条件は **2 プロダクト以上で実証されたら**（`CONTRIBUTING.md` の「昇格」）

`_` 接頭辞は「まだ npm パッケージではない」印。将来 `@edgescrum/ds-marketing`。

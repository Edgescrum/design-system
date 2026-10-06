# `_consumer/` — local 層 / オーディエンス: **お客さま（LIFF・予約ページ）**

**まだ空。** 最初の住人は `ConsumerShell`（ヘッダーのみ・390px 基準）で ADR 0026 §9-6 の**作業 6**。

- import してよい: `@edgescrum/ds-foundation` / core（`../*`）
- **してはならない: `_admin/` `_marketing/`**（`eslint.config.mjs` が error にする）
- 昇格条件は **2 プロダクト以上で実証されたら**（`CONTRIBUTING.md` の「昇格」）

`_` 接頭辞は「まだ npm パッケージではない」印。将来 `@edgescrum/ds-consumer`。

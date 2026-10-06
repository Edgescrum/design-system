# `_admin/` — local 層 / オーディエンス: **事業主（管理画面）**

**まだ空。** 最初の住人は `AdminShell`（サイドバー + パンくず + 幅 1280）で、
これは ADR 0026 §9-6 の**作業 6**。境界の lint を先に入れてあるのは、
**規則が無い状態でシェルを作ると PeCo の寸法が core に焼き付く**ため。

- import してよい: `@edgescrum/ds-foundation` / core（`../*`）
- **してはならない: `_consumer/` `_marketing/`**（`eslint.config.mjs` が error にする）
- ここから core へ**昇格**させる条件は **2 プロダクト以上で実証されたら**。
  呼び出し箇所ではなくプロダクトを数える（`CONTRIBUTING.md` の「昇格」）

`_` 接頭辞は「**まだ npm パッケージではない**」印。将来 `@edgescrum/ds-admin` に切り出す
（分割は再 export で無破壊にできるので可逆。不可逆なのは命名だけ）。

/**
 * 層のモデル（ADR 0026 §9-1 / §9-3）。**eslint.config.mjs と packages/ui/verify.mjs が
 * 同じ 1 つを読む。**
 *
 * ```
 *   foundation        トークン（primitives / semantic / component）      ← minimum bar
 *     └ core          全オーディエンス共通の部品
 *         └ local     オーディエンス別のシェルとパターン
 *                       · admin      事業主
 *                       · consumer   お客さま / LIFF
 *                       · marketing  未ログイン訪問者
 *             └ product   情報設計と業務部品（★ DS の層ではない。プロダクトのリポジトリ）
 * ```
 *
 * ## 向き（これを機械で固定するのが作業 5 の本題）
 *
 * | 層 | import してよい | してはならない |
 * |---|---|---|
 * | foundation | （なし） | **core**（下の層に依存すると minimum bar が core を連れてくる） |
 * | core | foundation | **local のどれか**（オーディエンス固有が全員に降りてくる） |
 * | local:X | foundation / core | **local:Y（X ≠ Y）** |
 *
 * ★ **2 箇所に書かないこと。** トークンの source glob を build と verify に 2 回書いて
 *   既定の `:root` を壊しかけた実例（作業 3）と同じ理由。オーディエンスを 1 つ足すときに
 *   lint と検査の片方しか直らないと、**足した層が無検査で入る**。
 *
 * ## 層のラベルは「場所」から導く（注釈を書かせない）
 *
 * `@layer core` のような注釈は**書き忘れても何も起きない**ので必ず腐る。
 * ラベルは**ディレクトリ位置の関数**とし、`classifySrcFile()` が唯一の判定器になる。
 * 位置が規則のどれにも当たらないファイルは**エラー**にする（「分類し忘れ」を
 * 黙って core として扱わないため）。
 */

/** local 層の軸は**オーディエンス**。プロダクトでもチームでもない（ADR 0026 の Why not）。 */
export const AUDIENCES = ["admin", "consumer", "marketing"];

/** `packages/ui/src/` 直下の local ディレクトリ名。`_` 接頭辞は「まだパッケージではない」印。 */
export const localDir = (audience) => `_${audience}`;

/** `packages/ui/src` 配下の相対パスから層のラベルを求める。該当なしは null（= 呼び出し側でエラー）。 */
export function classifySrcFile(relPath) {
  const parts = relPath.split("/");
  if (parts.length === 1) return "core";
  const audience = AUDIENCES.find((a) => parts[0] === localDir(a));
  return audience ? `local:${audience}` : null;
}

/** 層のラベルから「import してはならない」パターンを作る（eslint の `no-restricted-imports` 用）。 */
export function forbiddenPatternsFor(layer) {
  if (layer === "core") {
    // core は local のどれも見てはいけない（相対でも深い相対でも）
    return AUDIENCES.map((a) => ({
      group: [`**/${localDir(a)}`, `**/${localDir(a)}/**`],
      message:
        `core 層は local:${a} を import できない（ADR 0026 §9-1 の向き）。` +
        `全オーディエンスに降りてよい部品なら core に移すこと。` +
        `移す条件は「2 プロダクト以上で実証されたら」——呼び出し箇所ではなくプロダクトを数える`,
    }));
  }
  const audience = layer.startsWith("local:") ? layer.slice("local:".length) : null;
  if (audience) {
    return AUDIENCES.filter((a) => a !== audience).map((a) => ({
      group: [`**/${localDir(a)}`, `**/${localDir(a)}/**`],
      message:
        `local:${audience} は local:${a} を import できない（ADR 0026 §9-1）。` +
        `オーディエンスをまたいで共有したい部品は core へ昇格させること（2 プロダクト以上で実証されたら）`,
    }));
  }
  if (layer === "foundation") {
    return [
      {
        group: ["@edgescrum/ds-core", "@edgescrum/ds-core/**"],
        message:
          "foundation 層は core を import できない（ADR 0026 §9-1 の向き）。" +
          "foundation は minimum bar = 全プロダクト必須なので、core に依存すると core も必須になる",
      },
    ];
  }
  return [];
}

/** 旧名（作業 4 で shim 化・deprecate 済み）。DS 自身の中に残ってはならない。 */
export const RETIRED_PACKAGE_PATTERNS = [
  {
    group: ["@edgescrum/peco-*", "@edgescrum/peco-*/**"],
    message:
      "`@edgescrum/peco-*` は作業 4 で改名済み（`ds-foundation` / `ds-core`）。" +
      "旧名は再 export の shim で deprecated。DS 自身が shim を経由してはならない",
  },
];

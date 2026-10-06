// url=https://www.figma.com/design/emOS218FN67vHMpFgQSiM9/PeCo?node-id=31-9
// component=PecoLogo（★ DS の部品ではない。product 層の資産）
import figma from "figma";

// ★ **ブランドマークは DS に無い**（ADR 0026 / 2026-10-06）。
//   以前は `@edgescrum/peco-ui` から export していたが、共通層にプロダクト #1 の
//   ブランドが焼き付いている状態だったので product 層へ戻した。
//   実体は peco 側の `src/components/icons/PecoLogo.tsx`。
//
//   したがって `imports` は空にし、**product 層からの import を出す**
//   （`AppHeader.figma.ts` と同じ扱い）。消費側のパスはプロダクトごとに違うので、
//   ここに書いた 1 本が全プロダクトで正しくなることはない。
//
// ★ 商標的アセットなので MIT ライセンスの対象外（README に明記）。
//   大きさは高さのクラスで決める（例: FullScreenLoading は h-10）。
//   単体で置くときは aria-label を付けること（装飾でないなら読み上げ対象）。
//
// ★ Figma 側もいずれ local ライブラリ（「Edgescrum DS Local」）へ移す
//   —— §9-4。いまは共通ライブラリに同居している。
export default {
  example: figma.code`<PecoLogo aria-label="PeCo" className="h-10" />`,
  imports: [],
  id: "peco-logo",
  metadata: { nestable: true },
};

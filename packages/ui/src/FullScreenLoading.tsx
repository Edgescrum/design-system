import type { ReactNode } from "react";
import { Spinner } from "./Spinner";

/**
 * 画面いっぱいのローディング。ブランドマーク + スピナー + メッセージ。
 *
 * ## `logo` が必須である理由（ADR 0026 / 2026-10-06）
 *
 * この部品は以前 **`PecoLogo` を直描きしていた**。
 *
 * ```tsx
 * <PecoLogo aria-label="PeCo" className="mx-auto h-10" />   // ← 旧実装
 * ```
 *
 * 共通層（`core`）に**プロダクト #1 のブランドマークが焼き付いていた**ということで、
 * 2 つめのプロダクトがこの部品を使うと**そのプロダクトの読み込み画面に PeCo のロゴが出る**。
 * 変更理由がブランドにあるもの（= ロゴ）は共通層に置けるが、
 * **「どのブランドか」はプロダクト層が決める**（ADR 0026 の Decision 2）。
 *
 * ## なぜ省略可能（`logo?:`）にしないのか
 *
 * 省略可能にすると、渡し忘れた呼び出しが**型エラーにならず、ロゴが消えるだけ**になる。
 * ブランドマークの欠落は壊れた見た目として現れないので、気づけない。
 *
 * **必須にして、ロゴを出さない画面は `logo={null}` と明示的に書かせる。**
 * 「このプロダクトはここにマークを出さない」という判断が呼び出し側のコードに残る。
 *
 * ## 渡すもの
 *
 * **寸法と配置まで含めた完成形**を渡す（`cloneElement` で className を足したりしない）。
 *
 * ```tsx
 * <FullScreenLoading logo={<PecoLogo aria-label="PeCo" className="mx-auto h-10" />} />
 * ```
 *
 * 旧実装と同じ DOM にするには `aria-label` → `className` の順で渡すこと
 * （`PecoLogo` は `{...props}` を展開するので、React は渡した順に属性を吐く）。
 */
export function FullScreenLoading({
  logo,
  message = "読み込み中...",
}: {
  /**
   * ブランドマーク。**寸法・配置込みの完成形**を渡す。
   * ここにマークを出さないプロダクトは `null` を明示的に渡す。
   */
  logo: ReactNode;
  message?: string;
}) {
  return (
    <main className="flex min-h-app items-center justify-center bg-background">
      <div className="text-center">
        {logo}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Spinner size="md" />
          <p className="text-sm text-muted">{message}</p>
        </div>
      </div>
    </main>
  );
}

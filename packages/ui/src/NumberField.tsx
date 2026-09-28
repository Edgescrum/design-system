import { FormInput } from "./FormField";

/**
 * #1670 ⑥: 非負整数を入れる入力欄（所要時間 / 定員 / 料金 / 期限の時間数）。
 *
 * 運用者 FB（2026-09-02 / 実機 PC）: `type="number"` は
 * **値を消してから打ち直せない**うえ、スピナー（▲▼）が狭い欄の幅を食う。
 * 対象は 11 箇所あり、同じ属性を 11 回写経すると次に方針が変わったとき
 * 11 箇所を直すことになるので、**属性の持ち主をこの 1 ファイルに寄せる**。
 *
 * ## 決めたこと
 *
 * | 項目 | 値 | 理由 |
 * |---|---|---|
 * | `type` | `"text"` | スピナーが消える。空文字を保持できる（`type="number"` の `value=""` は不正値として扱いが割れる） |
 * | `inputMode` | `"numeric"` | **モバイルで数字キーボードが出る**。iOS / Android とも `inputmode` で決まる |
 * | `pattern` | **付けない** | 下記 |
 * | `min` / `max` / `required` | **付けない** | 下記 |
 *
 * ## ★ ネイティブ検証を足さないこと（#1662 の罠）
 *
 * `pattern` / `min` / `required` はどれも**ブラウザの制約検証**を有効にする。
 * 有効だと submit がブラウザ側で止まり、`handleSubmit` が 1 度も走らないので
 * **拒否の理由が画面に出ない**（消えるツールチップだけが出る）。#1662 では
 * 旧 `/edit` ページが `min` を付けていたため、自前の文言に到達できなかった。
 *
 * そのため `NumberField` は **これらの属性を型として受け取らない**。
 * 「うっかり付ける」を型検査で止める（`npm run typecheck` が落ちる）。
 * 値の検査は `numericFieldIssue`（`@/lib/forms/numeric-field`）を
 * **submit ハンドラの中で**呼ぶこと。
 *
 * ## 値は文字列で持つこと
 *
 * `onValueChange` は**打たれたそのままの文字列**を返す。呼び出し側が
 * `Math.max(1, parseInt(...))` で丸めると「消してから打ち直せない」が
 * そのまま復活する（それが本 Issue で報告された症状）。数値化は送信時に
 * `parseNumericInput` で 1 回だけ行う。
 */
export type NumberFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  | "type"
  | "inputMode"
  | "pattern"
  | "min"
  | "max"
  | "step"
  | "required"
  | "value"
  | "onChange"
> & {
  /** 入力中の生の文字列（空文字を許す）。 */
  value: string;
  /** 打たれたままの文字列を返す。丸めないこと。 */
  onValueChange: (raw: string) => void;
};

export function NumberField({
  value,
  onValueChange,
  ...rest
}: NumberFieldProps) {
  return (
    <FormInput
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    />
  );
}

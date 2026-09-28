import { forwardRef } from "react";

export function FormLabel({
  htmlFor,
  id,
  required,
  className,
  children,
}: {
  /**
   * 紐付ける control の `id`。**必ず同じファイル内に `id={...}` の相手を用意すること。**
   *
   * 相手のいない `htmlFor` はラベルをタップしてもフォーカスが当たらず、
   * タップ領域も文字の分だけ小さいまま残る（#1429 / #1461）。
   * 回帰は `src/lib/__tests__/form-label-htmlfor-1461.test.ts` が
   * `src/**` を走査して機械的に止める。
   */
  htmlFor?: string;
  /**
   * **選択肢のボタンが複数並ぶ**ものを囲む `role="group"` / `role="radiogroup"` から、
   * `aria-labelledby` で参照するための id（#1461 / #1875）。
   *
   * **`<button>` が labelable でないから、ではない**（#1875 で訂正）。
   * `<button>` は labelable element に**含まれる** —
   * `label.control` は `BUTTON` を返し、`SelectDropdown` の
   * `<button role="combobox">` はその事実に依存して `htmlFor` で紐付いている。
   * `htmlFor` が使えないのは、**候補が 2 つ以上あって
   * `<label htmlFor>` はそのうち 1 つしか指せず、群の名前にならない**とき。
   * 単一のボタン（`SelectDropdown` のトリガー等）なら `htmlFor` で正しく紐付くので、
   * **`role="group"` に「直し」に行かないこと。**
   *
   * `htmlFor` と併用しないこと。「相手がいないのに htmlFor が書いてある」状態に戻る。
   */
  id?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      id={id}
      className={`mb-1.5 block text-sm font-medium ${className ?? ""}`}
    >
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

export const FormInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function FormInput(props, ref) {
    return (
      <input
        ref={ref}
        {...props}
        className={`w-full rounded-xl border border-border bg-card px-4 py-3 ${props.className || ""}`}
      />
    );
  }
);

export const FormTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function FormTextarea(props, ref) {
    return (
      <textarea
        ref={ref}
        {...props}
        className={`w-full rounded-xl border border-border bg-card px-4 py-3 ${props.className || ""}`}
      />
    );
  }
);

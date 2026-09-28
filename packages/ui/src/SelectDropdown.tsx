"use client";

import { useState, useRef, useEffect, useId } from "react";
import { useIsDesktop } from "./use-is-desktop";

/**
 * 単一選択のセレクタ。**アプリ内の「1 つ選ぶ」UI はすべてこれに揃える。**
 *
 * ## なぜネイティブ `<select>` を使わないのか（#192 / #1449）
 *
 * 見た目が OS とブラウザに委ねられるため、同じ画面の中で
 * 「カテゴリは独自ドロップダウン / 役割は OS 標準」のように**混在する**。
 * 運用者からの指摘もそれ。`<select>` は `option` の中身を CSS で
 * 制御できないので、揃えたければ独自実装に寄せるしかない。
 *
 * ## ネイティブから移すときに落ちる 4 点（ここで全部埋めてある）
 *
 * ネイティブ `<select>` をタダで貰えていたものを、置き換えると失う。
 * **移植のたびに 1 箇所ずつ書き直させないため、部品側に入れてある。**
 *
 * 1. **キーボード操作** — Tab で到達し、Enter / Space / ↓ で開き、
 *    ↑ ↓ Home End で移動し、Enter / Space で選び、Esc で閉じる
 * 2. **タイプアヘッド** — 開いている間に文字を打つと前方一致の選択肢へ飛ぶ
 *    （選択肢が 48 個ある「開始時刻」で特に効く）
 * 3. **選択中の項目までスクロール** — 開いた瞬間に現在値が見えていること
 *    （これが無いと 48 個のリストは毎回 00:00 から探すことになる）
 * 4. **`disabled` / `id`（`<label htmlFor>` との紐付け）/ `required`**
 *
 * ## a11y
 *
 * APG の select-only combobox パターンに寄せている。
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
 *
 * - トリガー: `<button role="combobox">` + `aria-expanded` / `aria-haspopup="listbox"`
 *   / `aria-controls`。`<button>` は labelable なので `<label htmlFor>` が効く
 * - ポップアップ: `role="listbox"` の中に `role="option"` + `aria-selected`
 * - 選択肢は `<button>` のままにして**素の Tab 順とネイティブの Enter / Space**で
 *   動くようにしてある（`CategorySelector` と同じ判断。roving tabindex +
 *   `aria-activedescendant` を中途半端に実装すると「Tab でも辿れず
 *   activedescendant も動かない」状態になりやすい）
 * - ↑ ↓ は **DOM フォーカスそのもの**を動かす。読み上げも視覚のフォーカスリングも
 *   ここに追従するので、状態を二重に持たなくて済む
 *
 * ## `clearable`（既定 **false** = 安全側）— #1429
 *
 * dev HEAD は `onChange(v === value ? "" : v)` で、
 * **既に選ばれている項目をもう一度選ぶと無条件に選択解除**していた。
 * 任意の絞り込み（`/explore` のエリア、プロフィールの生まれ年など）では
 * 「もう一度押して解除」が唯一の解除手段なので成立するが、
 * **必須の 2 択でこれをやると利用者が気づけないデータ破損になる**:
 *
 *   「お客さまへの公開」で **公開** を選び直す
 *     → `value` が `""` になる → `("" === "public") = false`
 *     → **画面は「公開」のまま、保存だけ「非公開」で飛ぶ**
 *
 * 呼び出し側に `if (v === "") return;` を写経させる案は採らない
 * （全画面に広がる以上、1 箇所でも忘れた時点で上の事故が起きる）。
 * **既定を安全側（クリアしない）にして、解除が要る所だけ opt-in する。**
 * 現行の opt-in は `/explore` ・ `/settings` ・ 事業主登録ウィザード・
 * 顧客の仮登録・`ProfilePromptModal` の「任意の属性」だけ。
 */

export interface SelectDropdownOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  options: SelectDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** 指定すると同じ値の hidden input を出す（`<form>` のネイティブ送信用）。 */
  name?: string;
  /** 外枠に足すクラス。**幅の上限（`FIELD_MAX_W` 等）はここで渡す。** */
  className?: string;
  /** トリガーの id。`<label htmlFor>` と紐付けるときに渡す。 */
  id?: string;
  disabled?: boolean;
  /** `aria-required` を付ける（hidden input は制約検証の対象外なので表示用）。 */
  required?: boolean;
  /**
   * 選択済みの項目をもう一度選んだときに**選択解除するか**（既定 false）。
   *
   * 既定が安全側なのは意図的（#1429）。上のコメントを読まずに
   * 必須項目へ使っても壊れないようにしてある。**新しく true を渡すときは、
   * 「未選択」がその項目の正当な状態であることを確かめること。**
   */
  clearable?: boolean;
  /** `<label>` が無いときのアクセシブル名。 */
  ariaLabel?: string;
  /** 密度。`sm` は狭い列（時刻・席数など）向け。 */
  size?: "sm" | "md";
  "data-testid"?: string;
}

/** タイプアヘッドのバッファを捨てるまでの時間（ネイティブ `<select>` と同程度）。 */
const TYPEAHEAD_RESET_MS = 500;

export function SelectDropdown({
  options,
  value,
  onChange,
  placeholder = "選択してください",
  name,
  className = "",
  id,
  disabled = false,
  required = false,
  clearable = false,
  ariaLabel,
  size = "md",
  "data-testid": testId,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const typeahead = useRef<{ buffer: string; at: number }>({
    buffer: "",
    at: 0,
  });
  /**
   * #1429 ⑤: 幅の出し分けは **`useIsDesktop()` に任せる**。
   *
   * dev HEAD は `useState(false)` + `useEffect` でマウント時に 1 回だけ
   * `window.innerWidth` を測っており、
   *   - ウィンドウ幅を変えても PC 版 / モバイル版が切り替わらない
   *   - 最初のフレームは必ず「PC 版」で commit される
   * という 2 つの問題を持っていた。判定ロジックを写経すると
   * `use-is-desktop.ts` に書いてある検討（`useLayoutEffect` を却下した理由など）が
   * もう一度失われるので、**既存フックをそのまま使う**。
   */
  const isMobile = !useIsDesktop();
  const listboxId = useId();

  /** ↑ ↓ で移動する先。開いている間だけ意味を持つ。 */
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /**
   * 開いている間、`activeIndex` の選択肢に**実際の DOM フォーカス**を移す。
   *
   * `preventScroll` にしてから `scrollIntoView({ block: "nearest" })` を呼ぶのは、
   * 素の `focus()` だとページ全体がスクロールしてポップオーバーごと
   * 視界の外へ飛ぶことがあるため。`scrollIntoView` は jsdom に無いので optional call。
   */
  useEffect(() => {
    if (!open) return;
    const el = optionRefs.current[activeIndex];
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView?.({ block: "nearest" });
  }, [open, activeIndex]);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : undefined;

  function openList(index?: number) {
    if (disabled) return;
    typeahead.current = { buffer: "", at: 0 };
    setActiveIndex(index ?? (selectedIndex >= 0 ? selectedIndex : 0));
    setOpen(true);
  }

  function closeList(focusTrigger: boolean) {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }

  function handleSelect(v: string) {
    onChange(clearable && v === value ? "" : v);
    closeList(true);
  }

  /** トリガー上のキー操作。ネイティブ `<select>` と同じ入り口を用意する。 */
  function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      // Enter / Space は <button> の既定動作 (click → openList) に任せる。
      // ここで拾うと二重に開閉して開かない。
      e.preventDefault();
      openList(
        e.key === "ArrowUp" && selectedIndex < 0 ? options.length - 1 : undefined
      );
    }
  }

  /**
   * ポップアップ内のキー操作。選択肢の `<button>` から bubbling してくる。
   *
   * Enter / Space は握らない — `<button>` のネイティブ動作で `onClick` が走る。
   */
  function handleListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const last = options.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i >= last ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? last : i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(last);
    } else if (e.key === "Tab") {
      // Tab で外へ出るときは閉じる（フォーカスは Tab 本来の行き先へ）。
      setOpen(false);
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = Date.now();
      const t = typeahead.current;
      t.buffer = now - t.at > TYPEAHEAD_RESET_MS ? e.key : t.buffer + e.key;
      t.at = now;
      const needle = t.buffer.toLowerCase();
      const hit = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(needle)
      );
      if (hit >= 0) {
        e.preventDefault();
        setActiveIndex(hit);
      }
    }
  }

  /** Esc はポップアップ内のどこで押しても閉じ、フォーカスをトリガーに戻す。 */
  function handleRootKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      closeList(true);
    }
  }

  /** フォーカスが部品の外へ出たら閉じる（Tab 抜け / 他フィールドのクリック）。 */
  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget as Node | null;
    if (next && ref.current && !ref.current.contains(next)) setOpen(false);
  }

  const pad = size === "sm" ? "px-3 py-2" : "px-4 py-3";

  function optionList(variant: "mobile" | "desktop") {
    const itemPad = variant === "mobile" ? "rounded-xl px-3 py-3" : "rounded-lg px-3 py-2.5";
    const hover = variant === "mobile" ? "active:bg-accent/5" : "hover:bg-accent/5";
    return (
      <div
        id={listboxId}
        role="listbox"
        aria-label={ariaLabel ?? placeholder}
        onKeyDown={handleListKeyDown}
      >
        {options.map((o, i) => {
          const isSelected = o.value === value;
          return (
            <button
              type="button"
              role="option"
              aria-selected={isSelected}
              key={o.value}
              ref={(el) => {
                optionRefs.current[i] = el;
              }}
              data-testid={testId ? `${testId}-option-${o.value}` : undefined}
              data-option-value={o.value}
              onClick={() => handleSelect(o.value)}
              className={`flex w-full items-center gap-2.5 ${itemPad} text-left text-sm transition-colors ${
                isSelected ? "bg-accent/10" : hover
              }`}
            >
              <span className={isSelected ? "font-medium text-accent" : ""}>
                {o.label}
              </span>
              {isSelected && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                  className="ml-auto text-accent"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`relative w-full ${className}`}
      onKeyDown={handleRootKeyDown}
      onBlur={handleBlur}
    >
      {name && <input type="hidden" name={name} value={value} />}

      {/* トリガー */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-required={required || undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        data-testid={testId}
        /* ネイティブ `<select>` の `.value` に相当する読み取り口。
           テスト・e2e が「いま何が選ばれているか」を、見出しの文言に
           依存せずに読めるようにしておく（文言は Issue でよく変わる）。 */
        data-value={value}
        onClick={() => (open ? closeList(false) : openList())}
        onKeyDown={handleTriggerKeyDown}
        className={`flex w-full items-center gap-2 rounded-xl border border-border bg-card ${pad} text-left text-sm transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {/* 判定は `value` の真偽ではなく**一致する選択肢があるか**。
            ネイティブ `<select>` から移した箇所には
            `<option value="">未割当（おまかせ）</option>` のように
            **空文字が正規の選択肢**であるものがあり（担当スタッフ / リソース）、
            「値が空 ＝ 未選択」で判定すると選んだラベルが出ずに
            placeholder が出てしまう。 */}
        {selectedLabel !== undefined ? (
          <span className="flex-1 truncate text-foreground">{selectedLabel}</span>
        ) : (
          <span className="flex-1 truncate text-muted">{placeholder}</span>
        )}

        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* モバイル: 画面中央のモーダル風 */}
      {open && isMobile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm max-h-[70vh] overflow-y-auto rounded-2xl bg-card p-2 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 px-3 pt-2 text-sm font-semibold text-muted">
              {ariaLabel ?? placeholder}
            </div>
            {optionList("mobile")}
            <button
              type="button"
              data-testid={testId ? `${testId}-close` : undefined}
              onClick={() => closeList(true)}
              className="mt-1 w-full rounded-xl py-3 text-center text-sm font-medium text-muted active:bg-accent/5"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* PC: 従来のドロップダウンリスト */}
      {open && !isMobile && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl bg-card p-1 shadow-lg ring-1 ring-border">
          {optionList("desktop")}
        </div>
      )}
    </div>
  );
}

/**
 * ウィザードの「ステップ表示」の共通実装 (Issue #892)。
 *
 * それまで同じ進捗バーが 3 箇所 (事業主の初回登録 / メニュー新規作成 /
 * メニュー編集ヘッダ) にコピペされ、さらに代行予約 (`proxy-booking-setup-client.tsx`)
 * だけ「ラベルを横に並べたピル」という別デザインだった。見た目とマークアップを
 * このファイル 1 箇所に集約する。
 *
 * ## どちらの見た目に揃えたか
 *
 * **進捗バー + 「ステップ N / M：<ラベル>」**（3 実装が採っていた側）に揃えた。
 * `services/[id]/edit/edit-header.tsx` が「Tailwind スタイルは
 * `services/new/new-service-wizard.tsx` Step 1 と完全に揃えてある」と明記していて、
 * リポジトリ内ではこちらが既に「標準」として扱われていたため。
 * 代行予約のピル表示がこちらに寄る。
 *
 * ## マークアップ: なぜ `<ol>` / `<li>` なのか
 *
 * 進捗バーの 3 実装は素の `<div>` の羅列で、アクセシビリティ属性を一切持たない。
 * 一方、代行予約の `StepBar` だけは `<ol>` / `<li>` + `aria-current="step"` を
 * 持っていた。**見た目は 3 実装側が、マークアップは代行予約側が正しい**ので、
 * 共通化にあたっては両方の「正しい側」を採る。
 *
 * つまりこの共通化で `aria-current="step"` は
 * **失われるどころか 3 画面に増える**（#902 で「共通化したら適合していた画面の
 * アクセシビリティが退行した」事故が起きているので、そこは実測して守ること）。
 *
 * - `aria-current="step"` の必須親は無い。`listitem` の必須親 `list` は
 *   `<ol>` が満たす (`role="tab"` が `tablist` を要求するような罠は無い)
 * - Tailwind の preflight が `ol { list-style: none }` を当てるため、Safari /
 *   VoiceOver ではリストのセマンティクスが落ちる。これを防ぐため `<ol>` に
 *   明示的に `role="list"` を付ける (`<ol>` の暗黙ロールと同じなので上書きではない)
 * - セグメント自体はテキストを持たないので、各 `<li>` には `aria-label` で
 *   「ステップ N / M：<名前>」を与える (USWDS の step indicator と同じ考え方)
 *
 * ## 見えるラベルと読み上げラベルを分けている理由
 *
 * `label` は**見えるテキスト**（「ステップ 2 / 4：日時」の「日時」）だけを決める。
 * `stepNames` は**各セグメントの読み上げ名**だけを決める。
 * 事業主の初回登録は元々ラベルを出しておらず (「ステップ 1 / 4」のみ)、
 * 共通化のついでに見た目を変えないため、この 2 つを独立させてある。
 *
 * ## 現在の呼び出し元（#1204 時点）
 *
 * 事業主の初回登録 / メニュー新規作成 / メニュー編集ヘッダ の 3 画面。
 * **代行予約 (`proxy-booking-setup-client.tsx`) は #1204 で進捗表示そのものを
 * 外した**ので、もう呼んでいない（現在地はセクション見出しが持つ）。
 * 上の経緯に出てくる代行予約の記述は #892 当時の話。
 */

export interface StepProgressProps {
  /** 現在のステップ (1 始まり)。 */
  current: number;
  /** 全ステップ数。 */
  total: number;
  /**
   * 現在のステップ名。渡すと「ステップ N / M：<label>」と表示される。
   * 省略すると「ステップ N / M」だけになる。
   */
  label?: string;
  /**
   * 各ステップの名前 (長さ `total`)。**読み上げ専用**で、見た目には出ない。
   * 省略すると各セグメントは「ステップ N / M」とだけ読まれる。
   */
  stepNames?: readonly string[];
  /** ルート要素の data-testid。 */
  testId?: string;
  /** 「ステップ N / M」テキストの data-testid。 */
  labelTestId?: string;
}

export function StepProgress({
  current,
  total,
  label,
  stepNames,
  testId,
  labelTestId,
}: StepProgressProps) {
  return (
    <div data-testid={testId}>
      <ol
        role="list"
        aria-label="進捗"
        className="flex items-center gap-1"
        data-testid={testId ? `${testId}-segments` : undefined}
      >
        {Array.from({ length: total }).map((_, i) => {
          const name = stepNames?.[i];
          return (
            <li
              key={i}
              aria-current={i + 1 === current ? "step" : undefined}
              aria-label={`ステップ ${i + 1} / ${total}${name ? `：${name}` : ""}`}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < current ? "bg-accent" : "bg-border"
              }`}
            />
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-muted" data-testid={labelTestId}>
        ステップ {current} / {total}
        {label ? `：${label}` : ""}
      </p>
    </div>
  );
}

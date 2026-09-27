/**
 * className の条件結合。peco 本体のコンポーネントが使っている
 * `[...].filter(Boolean).join(" ")` パターンの共通化（外部依存を持たないため clsx は使わない）。
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

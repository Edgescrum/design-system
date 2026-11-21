/**
 * DESIGN.md（Google Labs の公開仕様・version alpha）の生成と検査の部品。
 *
 * 正は peco の `docs/adr/0032-ai-readable-usage-contracts-live-next-to-tokens-and-parts.md` と
 * `docs/v2/requirements/25_design-system.md` §10。ここに書くのはその**機械の側**だけ。
 *
 * ## 何が手書きで、何が生成か
 *
 * | 部分 | 正 | 誰が書く |
 * |---|---|---|
 * | `DESIGN.md` の本文（索引・never） | DESIGN.md そのもの | **人 / AI が手で書く** |
 * | `<部品名>.design.md`（使い方の約束） | その .md そのもの | **手で書く** |
 * | `DESIGN.md` 先頭の YAML（トークンの値） | DTCG（`tokens/*.json`） | **build が書き込む。手で触らない** |
 *
 * ★ 値を二重に持たないための形（ADR-0032 Decision 3）。YAML を手で直しても次の build で
 *   上書きされ、CI では `verify:design-md-frontmatter` が落とす。
 *
 * ## このファイルを core（packages/ui）からも使う理由
 *
 * 生成・検査の規則を 2 箇所に書くと片方だけ直る（`layers.mjs` / `modes.mjs` の冒頭と同じ理由）。
 * core → foundation の向きは層の規則で許されている（逆は禁止）。
 */
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve as resolvePath, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const FOUNDATION_DIR = join(HERE, "..");

/** DESIGN.md 仕様のバージョン（frontmatter の `version`）。 */
export const DESIGN_MD_SPEC_VERSION = "alpha";

// ---------------------------------------------------------------------------
// 使い方の約束（§10-2）
// ---------------------------------------------------------------------------

/** §10-2 の必須欄。`*.design.md` と DTCG の `$extensions["com.edgescrum.usage"]` で同じ。 */
export const REQUIRED_FIELDS = ["purpose", "use_when", "dont_use_when", "never", "check", "decided_by"];
/** 任意欄。 */
export const OPTIONAL_FIELDS = ["limits"];
/** 箇条でなければならない欄（1 件以上）。`dont_use_when` と `never` を空にしない（§10-2）。 */
const LIST_FIELDS = ["use_when", "dont_use_when", "never"];
/** DTCG の `$extensions` のキー。 */
export const USAGE_EXTENSION = "com.edgescrum.usage";

const nonEmpty = (v) =>
  typeof v === "string" ? v.trim().length > 0 : Array.isArray(v) && v.some((x) => nonEmpty(x));

/**
 * 約束 1 件（欄名 → 値）を §10-2 に照らして検査する。
 *
 * @param {Record<string, string | string[] | Record<string, string>>} fields
 * @returns {string[]} 問題の一覧（空なら合格）
 */
export function validateUsage(fields) {
  const problems = [];
  for (const key of Object.keys(fields)) {
    if (!REQUIRED_FIELDS.includes(key) && !OPTIONAL_FIELDS.includes(key)) {
      problems.push(`未知の欄 "${key}"（綴り違いではないか。欄は ${[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].join(" / ")}）`);
    }
  }
  for (const key of REQUIRED_FIELDS) {
    if (!(key in fields)) {
      problems.push(`必須欄 "${key}" が無い`);
      continue;
    }
    const value = fields[key];
    if (LIST_FIELDS.includes(key)) {
      if (!Array.isArray(value) || value.filter((x) => nonEmpty(x)).length === 0) {
        problems.push(`"${key}" が空（箇条で 1 件以上書く。§10-2 は空を許さない）`);
      }
    } else if (!nonEmpty(value)) {
      problems.push(`"${key}" が空`);
    }
  }
  // 各行に「→ 代わりに使うもの」を添える（§10-2。instead 欄を統合した形）
  if (Array.isArray(fields.dont_use_when)) {
    for (const line of fields.dont_use_when) {
      if (!/→\s*\S/.test(line)) problems.push(`dont_use_when の行に「→ 代わりに使うもの」が無い: ${line}`);
    }
  }
  if ("limits" in fields) {
    const limits = fields.limits;
    if (!limits || typeof limits !== "object" || Array.isArray(limits) || Object.keys(limits).length === 0) {
      problems.push(`"limits" を書くなら「名前: 値」を 1 件以上`);
    }
  }
  return problems;
}

/**
 * `*.design.md` の欄を読む。形は「英語のキーの箇条、中身は日本語」:
 *
 *     - purpose: 1 つの設定のオン / オフを切り替える
 *     - use_when:
 *       - 押した瞬間に反映してよい 2 択の設定
 *     - limits:
 *       - label_chars: 16
 *
 * 行頭の `- <小文字の英字>:` だけを欄として読む。見出しや段落は読み飛ばす。
 *
 * @returns {{fields: Record<string, any>, problems: string[]}}
 */
export function parseContract(markdown) {
  const fields = {};
  const problems = [];
  let current = null;
  let inFence = false;
  for (const raw of markdown.split("\n")) {
    if (/^\s*```/.test(raw)) {
      inFence = !inFence;
      current = null;
      continue;
    }
    if (inFence) continue;
    const top = /^- ([a-z_]+):\s*(.*)$/.exec(raw);
    if (top) {
      const [, key, inline] = top;
      if (key in fields) problems.push(`欄 "${key}" が 2 回ある`);
      current = key;
      fields[key] = inline.trim() ? inline.trim() : [];
      continue;
    }
    const child = /^\s{2,}- (.*)$/.exec(raw);
    if (child && current) {
      if (typeof fields[current] === "string") {
        problems.push(`欄 "${current}" に 1 行の値と箇条が混ざっている`);
        continue;
      }
      fields[current].push(child[1].trim());
      continue;
    }
    if (raw.trim() === "") continue;
    current = null; // 見出し・段落で欄が終わる
  }
  // limits は「名前: 値」の箇条 → オブジェクト
  if (Array.isArray(fields.limits)) {
    const limits = {};
    for (const line of fields.limits) {
      const m = /^([a-z_]+):\s*(.+)$/.exec(line);
      if (!m) problems.push(`limits の行が「名前: 値」になっていない: ${line}`);
      else limits[m[1]] = m[2].trim();
    }
    fields.limits = limits;
  }
  return { fields, problems: [...problems, ...validateUsage(fields)] };
}

// ---------------------------------------------------------------------------
// DESIGN.md の分解・`@path` 参照
// ---------------------------------------------------------------------------

/** 先頭の YAML と本文に分ける。YAML が無ければ frontmatter は null。 */
export function splitDesignMd(text) {
  if (!text.startsWith("---\n")) return { frontmatter: null, body: text };
  const end = text.indexOf("\n---\n", 4);
  if (end < 0) return { frontmatter: null, body: text };
  return { frontmatter: text.slice(0, end + 5), body: text.slice(end + 5) };
}

/** Markdown の見出しの slug（GitHub 風。日本語はそのまま残す）。 */
export function headingSlugs(markdown) {
  const slugs = new Set();
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) {
      slugs.add(
        m[1]
          .replace(/`/g, "")
          .trim()
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s_-]/gu, "")
          .replace(/\s/g, "-")
      );
    }
  }
  return slugs;
}

/**
 * 本文中の `@path[#fragment]` 参照を集める（仕様: インラインコードの中身全体が
 * `@<拡張子付きのパス>[#<断片>]` のものだけ。`@edgescrum/ds-core` は拡張子が無いので参照ではない）。
 */
export function findRefs(markdown) {
  const stripped = markdown.replace(/^\s*```[\s\S]*?^\s*```/gm, "");
  const refs = [];
  for (const m of stripped.matchAll(/`([^`\n]+)`/g)) {
    const r = /^@([^\s#]+\.[A-Za-z0-9]+)(?:#(\S+))?$/.exec(m[1]);
    if (r) refs.push({ raw: m[1], path: r[1], fragment: r[2] ?? null });
  }
  return refs;
}

const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

/**
 * DESIGN.md から辿れる `@path` 参照をすべて検査する。
 *
 * ★ 仕様どおり、**参照先の .md の中の参照も DESIGN.md のディレクトリから解決する**
 *   （書かれたファイルからの相対ではない）。
 *
 * @returns {Promise<{refs: Array<{from: string, raw: string, target: string}>, problems: string[], reached: Set<string>}>}
 */
export async function checkRefs(designMdPath) {
  const root = dirname(designMdPath);
  const refs = [];
  const problems = [];
  const reached = new Set([designMdPath]);
  const queue = [designMdPath];
  while (queue.length) {
    const file = queue.shift();
    const text = await readFile(file, "utf8");
    for (const ref of findRefs(splitDesignMd(text).body)) {
      const from = relative(root, file);
      if (ref.path.startsWith("/")) {
        problems.push(`${from}: ${ref.raw} — 先頭の / は禁止（DESIGN.md のディレクトリからの相対で書く）`);
        continue;
      }
      const target = resolvePath(root, ref.path);
      if (target !== root && !target.startsWith(root + sep)) {
        problems.push(`${from}: ${ref.raw} — DESIGN.md のディレクトリの外を指している`);
        continue;
      }
      if (!(await exists(target))) {
        problems.push(`${from}: ${ref.raw} — 参照先が無い（${relative(root, target)}）`);
        continue;
      }
      refs.push({ from, raw: ref.raw, target });
      if (/\.(md|markdown)$/.test(target)) {
        if (ref.fragment) {
          const slugs = headingSlugs(await readFile(target, "utf8"));
          if (!slugs.has(ref.fragment.toLowerCase())) {
            problems.push(`${from}: ${ref.raw} — 見出し #${ref.fragment} が ${ref.path} に無い`);
          }
        }
        if (!reached.has(target)) {
          reached.add(target);
          queue.push(target);
        }
      }
    }
  }
  return { refs, problems, reached };
}

/** dir 配下の `*.design.md` を集める（node_modules / dist は見ない）。 */
export async function findContractFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await findContractFiles(full)));
    else if (entry.name.endsWith(".design.md")) out.push(full);
  }
  return out.sort();
}

// ---------------------------------------------------------------------------
// 先頭 YAML の生成
// ---------------------------------------------------------------------------

const PLAIN_KEY = /^[A-Za-z_][A-Za-z0-9_-]*$/;

/** 決まった形の YAML を書く（依存を足さないための最小実装。文字列は常に二重引用符）。 */
export function toYaml(value, indent = 0) {
  const pad = " ".repeat(indent);
  const lines = [];
  for (const [key, val] of Object.entries(value)) {
    const k = PLAIN_KEY.test(key) ? key : JSON.stringify(key);
    if (val && typeof val === "object" && !Array.isArray(val)) {
      lines.push(`${pad}${k}:`);
      lines.push(toYaml(val, indent + 2));
    } else if (Array.isArray(val)) {
      throw new Error(`YAML に書けない値（配列）: ${key} = ${JSON.stringify(val)}`);
    } else if (typeof val === "number") {
      lines.push(`${pad}${k}: ${val}`);
    } else if (typeof val === "string") {
      lines.push(`${pad}${k}: ${JSON.stringify(val)}`);
    } else {
      throw new Error(`YAML に書けない値: ${key} = ${JSON.stringify(val)}`);
    }
  }
  return lines.join("\n");
}

/** `{a.b.c}` → ツリーの実値（入れ子の参照も辿る）。 */
function resolveRef(tree, value) {
  if (typeof value !== "string" || !value.startsWith("{")) return value;
  let node = tree;
  for (const key of value.slice(1, -1).split(".")) {
    node = node?.[key];
    if (!node) throw new Error(`参照が解決できません: ${value}`);
  }
  if (!("$value" in node)) throw new Error(`参照先がトークンではありません: ${value}`);
  return resolveRef(tree, node.$value);
}

/** DTCG cubicBezier（[x1, y1, x2, y2]）→ CSS。Style Dictionary の cubicBezier/css と同じ綴り。 */
const cubicBezierCss = (v) => (Array.isArray(v) ? `cubic-bezier(${v.join(", ")})` : v);

/** DTCG の木を歩いて (path[], token) を返す。 */
function* walk(node, path = []) {
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith("$") || !val || typeof val !== "object") continue;
    if ("$value" in val) yield [[...path, key], val];
    else yield* walk(val, [...path, key]);
  }
}

/** obj の path に値を置く。既にあれば落とす（2 つのトークンが同じ名前に写るのを黙認しない）。 */
function put(obj, path, value, what) {
  let node = obj;
  for (const key of path.slice(0, -1)) {
    node[key] ??= {};
    if (typeof node[key] !== "object") throw new Error(`${what}: ${path.join(".")} が既存の値と衝突`);
    node = node[key];
  }
  const last = path[path.length - 1];
  if (last in node) throw new Error(`${what}: ${path.join(".")} が 2 回書かれる`);
  node[last] = value;
}

/**
 * DESIGN.md 仕様の「平坦化した名前の衝突」（`colors.a-b` と `colors.a.b`）を検出する。
 * 仕様の linter がエラーにするので、生成の時点で落とす。
 */
function assertNoFlatCollision(section, tree) {
  const seen = new Map();
  const visit = (node, path) => {
    for (const [key, val] of Object.entries(node)) {
      const p = [...path, key];
      if (val && typeof val === "object" && !("fontSize" in val || "fontWeight" in val || "fontFamily" in val)) {
        visit(val, p);
      } else {
        const flat = p.join("-");
        if (seen.has(flat)) throw new Error(`${section}: ${seen.get(flat)} と ${p.join(".")} が同じ名前 ${flat} になる`);
        seen.set(flat, p.join("."));
      }
    }
  };
  visit(tree, []);
}

/**
 * DTCG（tokens/*.json）から DESIGN.md のトークン群を作る。
 *
 * | DTCG | DESIGN.md | 備考 |
 * |---|---|---|
 * | `color.semantic.json` の全トークン | `colors.*` | 実値に解決。**primitives は載せない**（アプリコードからの直接使用が禁止のため） |
 * | `text.*` | `typography.*.fontSize` | 別名（`{text.2xs}`）は `{typography.2xs.fontSize}` の参照で書く |
 * | `font.weight.*` | `typography.weight.*.fontWeight` | |
 * | `font.<family>` | `typography.family.<family>.fontFamily` | CSS と同じ書き方（空白を含む名前は引用符）で連結 |
 * | `radius.*` | `rounded.*` | |
 * | `space.*` | `spacing.*` | ページ余白（`spacing.page.*`）と用途の 3 種 |
 * | `size.content.*` | `spacing.content.*` | 本文の最大幅 |
 * | `font-size.*`（プリミティブ） | `typography.scale.size.<px>.fontSize` | 参照用の生の段。本文の Never でアプリからの直接使用を禁じる |
 * | `font-weight.*`（プリミティブ） | `typography.scale.weight.<n>.fontWeight` | 同上 |
 * | `space-scale.*`（プリミティブ） | `spacing.scale.<px>` | 同上 |
 * | `motion.duration.*` | `motion.duration-<名前>.duration` | 仕様の Motion（`duration` / `delay` / `timingFunction`）。仕様上 motion は平らな map なので `-` で連結する |
 * | `motion.productive.*` / `motion.expressive.*` | `motion.<系統>-<名前>.timingFunction` | `cubic-bezier(…)` に展開 |
 * | `motion.transition.*` | `motion.transition-<名前>` | `duration` / `delay` / `timingFunction` の 3 つ |
 *
 * ★ 時間・イージングのプリミティブ（`duration.*` / `easing.*`）は載せない。仕様の `motion` は
 *   「用途の名前（state-change / surface-enter 等）で引く」もので、生の速さの段を並べる場所ではないため。
 *   色のプリミティブを載せないのと同じ扱い。
 */
export function buildFoundationTokens({
  semanticJson,
  primitivesJson,
  dimensionJson,
  typographyJson,
  scalePrimitivesJson = {},
  motionJson = {},
}) {
  const tree = {
    ...semanticJson,
    ...primitivesJson,
    ...dimensionJson,
    ...typographyJson,
    ...scalePrimitivesJson,
    ...motionJson,
  };
  const colors = {};
  for (const [path, token] of walk(semanticJson)) {
    put(colors, path, resolveRef(tree, token.$value), "colors");
  }
  const typography = {};
  for (const [path, token] of walk(dimensionJson.text ?? {})) {
    const v = token.$value;
    const value =
      typeof v === "string" && v.startsWith("{text.")
        ? `{typography.${v.slice("{text.".length, -1)}.fontSize}`
        : resolveRef(tree, v);
    put(typography, path, { fontSize: value }, "typography");
  }
  for (const [path, token] of walk(typographyJson.font ?? {})) {
    if (token.$type === "fontWeight") {
      put(typography, path, { fontWeight: resolveRef(tree, token.$value) }, "typography");
    } else if (token.$type === "fontFamily") {
      put(typography, ["family", ...path], { fontFamily: [].concat(token.$value).map((f) => (f.includes(" ") ? `'${f}'` : f)).join(", ") }, "typography");
    }
  }
  // プリミティブの段（参照用。DESIGN.md 本文の Never で直接使用を禁じる）
  for (const [path, token] of walk(scalePrimitivesJson["font-size"] ?? {})) {
    put(typography, ["scale", "size", ...path], { fontSize: resolveRef(tree, token.$value) }, "typography");
  }
  for (const [path, token] of walk(scalePrimitivesJson["font-weight"] ?? {})) {
    put(typography, ["scale", "weight", ...path], { fontWeight: resolveRef(tree, token.$value) }, "typography");
  }
  const rounded = {};
  for (const [path, token] of walk(dimensionJson.radius ?? {})) {
    put(rounded, path, resolveRef(tree, token.$value), "rounded");
  }
  const spacing = {};
  for (const [path, token] of walk(dimensionJson.space ?? {})) {
    put(spacing, path, resolveRef(tree, token.$value), "spacing");
  }
  for (const [path, token] of walk(dimensionJson.size ?? {})) {
    put(spacing, path, resolveRef(tree, token.$value), "spacing");
  }
  for (const [path, token] of walk(scalePrimitivesJson["space-scale"] ?? {})) {
    put(spacing, ["scale", ...path], resolveRef(tree, token.$value), "spacing");
  }
  const motion = {};
  for (const [path, token] of walk(motionJson.motion ?? {})) {
    const name = path.join("-");
    if (token.$type === "duration") {
      put(motion, [name], { duration: resolveRef(tree, token.$value) }, "motion");
    } else if (token.$type === "cubicBezier") {
      put(motion, [name], { timingFunction: cubicBezierCss(resolveRef(tree, token.$value)) }, "motion");
    } else if (token.$type === "transition") {
      const v = token.$value;
      put(
        motion,
        [name],
        {
          duration: resolveRef(tree, v.duration),
          delay: resolveRef(tree, v.delay),
          timingFunction: cubicBezierCss(resolveRef(tree, v.timingFunction)),
        },
        "motion"
      );
    } else {
      throw new Error(`motion: ${path.join(".")} の $type ${token.$type} を DESIGN.md に写せない`);
    }
  }
  for (const [name, section] of Object.entries({ colors, typography, rounded, spacing })) {
    assertNoFlatCollision(name, section);
  }
  return { colors, typography, rounded, spacing, motion };
}

/** frontmatter の文字列（`---` で挟んだもの）を作る。 */
export function renderFrontmatter({ name, description, tokens = {} }) {
  const head = {
    version: DESIGN_MD_SPEC_VERSION,
    name,
    description,
    ...tokens,
  };
  return (
    "---\n" +
    "# 生成物（DTCG と package.json から build が書き込む）。手で編集しないこと。\n" +
    toYaml(head) +
    "\n---\n"
  );
}

const readJson = async (p) => JSON.parse(await readFile(p, "utf8"));

/** パッケージの DESIGN.md に書くべき frontmatter。tokens を渡すとトークン群も載せる。 */
export async function expectedFrontmatter(pkgDir, tokens) {
  const pkg = await readJson(join(pkgDir, "package.json"));
  return renderFrontmatter({ name: pkg.name, description: pkg.description, tokens });
}

/** foundation のトークン群（DTCG を読んで buildFoundationTokens に渡す）。 */
export async function foundationTokens(dir = FOUNDATION_DIR) {
  const t = (n) => readJson(join(dir, "tokens", n));
  return buildFoundationTokens({
    semanticJson: await t("color.semantic.json"),
    primitivesJson: await t("color.primitives.json"),
    dimensionJson: await t("dimension.json"),
    typographyJson: await t("typography.json"),
    scalePrimitivesJson: {
      ...(await t("typography.primitives.json")),
      ...(await t("space.primitives.json")),
      ...(await t("motion.primitives.json")),
    },
    motionJson: await t("motion.json"),
  });
}

/**
 * DESIGN.md の先頭 YAML を期待値に揃える。**本文には触らない。**
 *
 * @param {{pkgDir: string, tokens?: object, write: boolean}} opts
 * @returns {Promise<{inSync: boolean, expected: string, actual: string | null}>}
 */
export async function syncDesignMd({ pkgDir, tokens, write }) {
  const file = join(pkgDir, "DESIGN.md");
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    throw new Error(`${file} が無い。本文は手書きが正なので、生成器は新規作成しない`);
  }
  const { frontmatter, body } = splitDesignMd(text);
  const expected = await expectedFrontmatter(pkgDir, tokens);
  const inSync = frontmatter === expected;
  if (!inSync) {
    if (write) {
      await writeFile(file, expected + body, "utf8");
      console.log(`DESIGN.md の先頭 YAML を更新: ${relative(process.cwd(), file)}`);
    } else {
      console.warn(
        `DESIGN.md の先頭 YAML が DTCG と一致しない（CI のため書き込まない）: ${relative(process.cwd(), file)}`
      );
    }
  }
  return { inSync, expected, actual: frontmatter };
}

/** foundation（packages/tokens/DESIGN.md）用。build.mjs から呼ぶ。 */
export async function syncFoundationDesignMd({ write }) {
  return syncDesignMd({ pkgDir: FOUNDATION_DIR, tokens: await foundationTokens(), write });
}

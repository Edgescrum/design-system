/**
 * トークンの機械検査。`pnpm --filter @edgescrum/ds-foundation verify` / CI から走る。
 *
 * ## なぜ必要か（ADR 0026 作業 3）
 *
 * モード機構（Decision 3）はいまのところ**実在するモードが 0 件**である。
 * プロダクトは PeCo 1 つしか無いので、既定値がそのまま `:root` に出れば足りる。
 *
 * **だから実行されない経路になる。** そして実行されない経路は黙って壊れる ——
 * この DS では実例がある: `sync-figma.mjs` の docstring は「モード "Light"」と
 * 書いていたが、名前を設定するコードは **`.forEach(() => {})` という空のループ**で、
 * Figma 側は既定の "Mode 1" のままだった。モードが 1 本のあいだ誰も困らないので
 * 誰も気づかなかった。
 *
 * そこで `fixtures/mode-example.json` という標本を置き、**モードの全経路**
 * （検証 → CSS 生成 → Figma payload）をここで実際に通す。
 * 標本は `tokens/` の外にあるので **dist には 1 バイトも入らない。**
 *
 * ## 空振り防止
 *
 * 「検査 0 件で緑」にならないよう、各検査は**対象が存在すること**を先に確定させる。
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_MODE,
  LAYOUT_NAMESPACES,
  MODES_DIR,
  PRIMITIVE_NAMESPACES,
  REDUCED_MOTION_EXTENSION,
  TOKENS_SOURCE_GLOB,
  assertModeOverridesSemanticOnly,
  flattenOverrides,
  loadModes,
  overridableKeys,
  renderModeCss,
} from "./modes.mjs";
import { FIGMA_UNSUPPORTED_TYPES, buildFigmaPayload } from "./scripts/figma-payload.mjs";
import {
  USAGE_EXTENSION,
  checkRefs,
  expectedFrontmatter,
  findContractFiles,
  foundationTokens,
  parseContract,
  splitDesignMd,
  validateUsage,
} from "./scripts/design-md.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const TOKEN_DIR = join(HERE, "tokens");

let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${name}\n     ${err.message.split("\n").join("\n     ")}`);
  }
}
const eq = (actual, expected, what) => {
  if (actual !== expected) throw new Error(`${what}: 期待 ${expected} / 実際 ${actual}`);
};
const ok = (cond, what) => {
  if (!cond) throw new Error(what);
};
const throws = (fn, re, what) => {
  let message = null;
  try {
    fn();
  } catch (err) {
    message = err.message;
  }
  if (message === null) throw new Error(`${what}: 例外が投げられなかった`);
  if (!re.test(message)) throw new Error(`${what}: 例外の文面が合わない → ${message}`);
};

const readJson = async (p) => JSON.parse(await readFile(p, "utf8"));
const primitivesJson = await readJson(join(TOKEN_DIR, "color.primitives.json"));
const semanticJson = await readJson(join(TOKEN_DIR, "color.semantic.json"));
const dimensionJson = await readJson(join(TOKEN_DIR, "dimension.json"));
const typographyJson = await readJson(join(TOKEN_DIR, "typography.json"));
const motionJson = await readJson(join(TOKEN_DIR, "motion.json"));
/** 色以外のプリミティブ（文字サイズ・太さ・余白・時間・イージング）。sync-figma.mjs と同じ合わせ方 */
const scalePrimitivesJson = {
  ...(await readJson(join(TOKEN_DIR, "typography.primitives.json"))),
  ...(await readJson(join(TOKEN_DIR, "space.primitives.json"))),
  ...(await readJson(join(TOKEN_DIR, "motion.primitives.json"))),
};
/** 全トークンの木（別名の解決用）。トップレベルの名前空間は重ならない */
const allTokensTree = {
  ...primitivesJson,
  ...semanticJson,
  ...dimensionJson,
  ...typographyJson,
  ...motionJson,
  ...scalePrimitivesJson,
};
/** `{a.b.c}` → 参照先のトークン（ノード）。 */
function tokenAt(ref) {
  let node = allTokensTree;
  for (const key of ref.slice(1, -1).split(".")) {
    node = node?.[key];
    if (!node) throw new Error(`参照が解決できません: ${ref}`);
  }
  if (!("$value" in node)) throw new Error(`参照先がトークンではありません: ${ref}`);
  return node;
}
/** 別名を辿って実値にする（文字列の $value のみ）。 */
const resolveDeep = (value) =>
  typeof value === "string" && value.startsWith("{") ? resolveDeep(tokenAt(value).$value) : value;

/** DTCG ツリーのトークンパス（ドット区切り）を集める。 */
function tokenPaths(node, path = [], out = new Set()) {
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (val && typeof val === "object" && "$value" in val) out.add([...path, key].join("."));
    else if (val && typeof val === "object") tokenPaths(val, [...path, key], out);
  }
  return out;
}
const semanticKeys = tokenPaths(semanticJson);
/** モードが上書きしてよいキー（build.mjs と同じ関数）。色 + space / size（ADR 0027） */
const defaultKeys = overridableKeys(semanticJson, dimensionJson);

/** 参照解決（build.mjs と同じ規則）。 */
function resolve(value) {
  if (!value.startsWith("{")) return value;
  const path = value.slice(1, -1).split(".");
  let node = path[0] === "color" ? primitivesJson.color : semanticJson;
  for (const key of path[0] === "color" ? path.slice(1) : path) {
    node = node?.[key];
    if (!node) throw new Error(`参照が解決できません: ${value}`);
  }
  return resolve(node.$value);
}

// ---------------------------------------------------------------------------
// 0. 空振り防止 — 検査対象が十分あること
// ---------------------------------------------------------------------------
check("verify:fixtures — 検査対象が存在する", () => {
  ok(semanticKeys.size >= 30, `semantic のトークンが少なすぎる（${semanticKeys.size} 件）`);
  ok(defaultKeys.has("size.content.admin"), "size.content.admin がモードの上書き対象に入っていない");
  ok(defaultKeys.has("accent"), "accent が無い");
  ok(defaultKeys.has("rating.3.fg"), "rating.3.fg が無い（入れ子のパスが取れていない）");
});

// ---------------------------------------------------------------------------
// 1. ★ モードの置き場所が Style Dictionary の source の外にあること
// ---------------------------------------------------------------------------
// 実装中に実際に踏んだ事故の再発防止。source が `tokens/**/*.json` なので、
// モードを `tokens/modes/` に置くと**モードファイルが通常のトークンとして読まれ、
// 既定の :root を上書きする**。実測: `tokens/modes/acme.json` を置いた瞬間に
// dist/css/tokens.css の --accent が PeCo のサーモン (#f08c79) から
// 青 (oklch(48.8% 0.243 264.376)) に変わった。
//
// **モードが 0 件のあいだは絶対に起きない**ので、最初のプロダクトがモードを
// 足した日に PeCo の既定が壊れる、という形でしか現れない。
check("verify:modes-outside-source — モードの置き場所が source glob の外にある", () => {
  const pkgRoot = HERE;
  const modesRel = MODES_DIR.slice(pkgRoot.length + 1);
  eq(modesRel, "modes", "モードディレクトリ（パッケージルートからの相対）");

  // source glob が覆う範囲に modes/ が入っていないこと
  ok(
    TOKENS_SOURCE_GLOB.startsWith("tokens/"),
    `source glob の前提が変わった: ${TOKENS_SOURCE_GLOB}`
  );
  ok(
    !modesRel.startsWith("tokens/"),
    `モードが source glob (${TOKENS_SOURCE_GLOB}) の中にある: ${modesRel}。` +
      `既定の :root が上書きされる`
  );
});

// ---------------------------------------------------------------------------
// 2. 実在するモードは 0 件 → 生成物に modes/ を作らない
// ---------------------------------------------------------------------------
const realModes = await loadModes();
check("verify:no-real-modes — modes/ が空なら生成物は増えない", () => {
  eq(realModes.length, 0, "実在するモード数（増やすときは README の手順に従う）");
});

// ---------------------------------------------------------------------------
// 2. 標本モードで CSS 生成の経路を通す
// ---------------------------------------------------------------------------
const fixtureRaw = await readJson(join(HERE, "fixtures", "mode-example.json"));
const fixture = { name: "mode-example", overrides: flattenOverrides(fixtureRaw) };

check("verify:mode-css — 標本モードの CSS が差分だけを持つ", () => {
  assertModeOverridesSemanticOnly(fixture, defaultKeys);
  const css = renderModeCss(fixture, resolve);

  ok(css.includes('[data-ds-mode="mode-example"] {'), "属性セレクタになっていない");
  // 上書きした 3 本だけが出ること（差分のみ）
  const vars = [...css.matchAll(/^ {2}--([a-z0-9-]+):/gm)].map((m) => m[1]).sort();
  eq(vars.join(","), "accent,accent-dark,rating-3-fg", "出力された変数");
  // 参照が実値に解決されていること（var() の持ち回しではない）
  ok(/--accent: oklch\(/.test(css), `accent が実値に解決されていない:\n${css}`);
  // 既定と違う値であること（標本が既定と同じだと「上書きできた」と言えない）
  ok(
    !css.includes(resolve(semanticJson.accent.$value)),
    "標本の accent が既定と同じ値。上書きの証明にならない"
  );
});

// ---------------------------------------------------------------------------
// 3. モードが上書きできないキーを拒否する（2 つの事故）
// ---------------------------------------------------------------------------
check("verify:mode-guard — 綴り違いを拒否する", () => {
  throws(
    () => assertModeOverridesSemanticOnly({ name: "x", overrides: { acccent: {} } }, defaultKeys),
    /既定（color\.semantic\.json \/ dimension\.json の space・size）に無いキー/,
    "綴り違い"
  );
});

check("verify:mode-guard — primitives の上書きを拒否する（ADR 0026 Decision 3）", () => {
  throws(
    () =>
      assertModeOverridesSemanticOnly(
        { name: "x", overrides: { "color.salmon.500": {} } },
        defaultKeys
      ),
    /primitives はモードを持たない/,
    "primitives への侵入"
  );
});

check("verify:mode-guard — 正しいキーは通る", () => {
  assertModeOverridesSemanticOnly({ name: "x", overrides: { accent: {} } }, defaultKeys);
  assertModeOverridesSemanticOnly({ name: "x", overrides: { "rating.3.fg": {} } }, defaultKeys);
});

// ---------------------------------------------------------------------------
// 4. Figma payload — 既定モードに名前が付くこと（空ループだった箇所）
// ---------------------------------------------------------------------------
/** 「Figma 側が空」の状態。新規ファイル相当。 */
const EMPTY = { variableCollections: {}, variables: {} };

check("verify:figma-default-mode-name — 新規作成時に既定モードへ名前を付ける", () => {
  const { payload } = buildFigmaPayload({
    primitivesJson,
    semanticJson,
    dimensionJson,
    scalePrimitivesJson,
    motionJson,
    modes: [],
    defaultModeName: DEFAULT_MODE,
    existing: EMPTY,
  });
  const renames = payload.variableModes.filter((m) => m.action === "UPDATE");
  eq(renames.length, 2, "名前を付けるモード数（Primitives と Semantic の既定モード）");
  ok(
    renames.every((m) => m.name === DEFAULT_MODE),
    `モード名が ${DEFAULT_MODE} になっていない: ${JSON.stringify(renames)}`
  );
});

check("verify:figma-default-mode-name — 既に Base なら rename を出さない（冪等）", () => {
  const already = {
    variableCollections: {
      c1: { id: "c1", name: "Primitives", defaultModeId: "m1", modes: [{ modeId: "m1", name: DEFAULT_MODE }] },
      c2: { id: "c2", name: "Semantic", defaultModeId: "m2", modes: [{ modeId: "m2", name: DEFAULT_MODE }] },
    },
    variables: {},
  };
  const { payload } = buildFigmaPayload({
    primitivesJson,
    semanticJson,
    dimensionJson,
    scalePrimitivesJson,
    motionJson,
    modes: [],
    defaultModeName: DEFAULT_MODE,
    existing: already,
  });
  eq(payload.variableModes.length, 0, "rename の件数");
});

check("verify:figma-default-mode-name — 名前が違えば rename を出す", () => {
  const stale = {
    variableCollections: {
      c2: { id: "c2", name: "Semantic", defaultModeId: "m2", modes: [{ modeId: "m2", name: "Mode 1" }] },
    },
    variables: {},
  };
  const { payload } = buildFigmaPayload({
    primitivesJson,
    semanticJson,
    dimensionJson,
    scalePrimitivesJson,
    motionJson,
    modes: [],
    defaultModeName: DEFAULT_MODE,
    existing: stale,
  });
  const renames = payload.variableModes.filter((m) => m.id === "m2" && m.action === "UPDATE");
  eq(renames.length, 1, 'Semantic の "Mode 1" → "Base" の rename');
});

// ---------------------------------------------------------------------------
// 5. Figma payload — 標本モードが CREATE され、差分の値だけが書かれること
// ---------------------------------------------------------------------------
check("verify:figma-modes — 標本モードが CREATE され値が alias で入る", () => {
  const { payload, stats } = buildFigmaPayload({
    primitivesJson,
    semanticJson,
    dimensionJson,
    scalePrimitivesJson,
    motionJson,
    modes: [fixture],
    defaultModeName: DEFAULT_MODE,
    existing: EMPTY,
  });

  const created = payload.variableModes.filter((m) => m.action === "CREATE");
  eq(created.length, 1, "CREATE されるモード数");
  eq(created[0].name, "mode-example", "作られるモード名");

  // ★ Semantic コレクションに作られること（primitives に生えないこと）
  const semColId = payload.variableCollections.find((c) => c.name === "Semantic").id;
  eq(created[0].variableCollectionId, semColId, "モードの所属コレクション");

  // 標本の 3 本だけがそのモードに書かれる
  const modeValues = payload.variableModeValues.filter((v) => v.modeId === created[0].id);
  eq(modeValues.length, 3, "モードに書かれる値の数（標本の上書き 3 本）");
  ok(
    modeValues.every((v) => v.value?.type === "VARIABLE_ALIAS"),
    `参照はプリミティブ変数への alias になるべき: ${JSON.stringify(modeValues)}`
  );
  ok(stats.modeNames.includes("mode-example"), "stats にモード名が出ない");
});

check("verify:figma-modes — 既存モードがあれば CREATE せず値だけ更新する（冪等）", () => {
  const withMode = {
    variableCollections: {
      c2: {
        id: "c2",
        name: "Semantic",
        defaultModeId: "m2",
        modes: [
          { modeId: "m2", name: DEFAULT_MODE },
          { modeId: "m9", name: "mode-example" },
        ],
      },
    },
    variables: {},
  };
  const { payload } = buildFigmaPayload({
    primitivesJson,
    semanticJson,
    dimensionJson,
    scalePrimitivesJson,
    motionJson,
    modes: [fixture],
    defaultModeName: DEFAULT_MODE,
    existing: withMode,
  });
  eq(payload.variableModes.filter((m) => m.action === "CREATE").length, 0, "CREATE の件数");
  eq(payload.variableModeValues.filter((v) => v.modeId === "m9").length, 3, "m9 に書く値の数");
});

check("verify:figma-modes — 既定に無いキーを含むモードは payload 生成で落ちる", () => {
  throws(
    () =>
      buildFigmaPayload({
        primitivesJson,
        semanticJson,
        dimensionJson,
        scalePrimitivesJson,
        motionJson,
        modes: [{ name: "bad", overrides: { nope: { $value: "#000000" } } }],
        defaultModeName: DEFAULT_MODE,
        existing: EMPTY,
      }),
    /対応する変数が見つかりません/,
    "既定に無いキー"
  );
});

// ---------------------------------------------------------------------------
// 6. ページ余白 / 本文幅（ADR 0027）
// ---------------------------------------------------------------------------
// ★ build.mjs は「色以外の名前空間」を列挙して除外する方式なので、名前空間を足すと
//   **黙って色として出る**（`--color-space-page-block` = `bg-space-page-block` が生える）。
//   実装中に踏む前提の罠なので、生成物を直接見る。

/** peco が今日描画している値（ADR 0027 の検証条件「値は peco と同一」）。変えるならモードで。 */
const PECO_LAYOUT_VALUES = {
  "space.page.block": "1.5rem", // py-6
  "space.page.block-sm": "2rem", // sm:py-8
  "space.page.inline": "1rem", // px-4
  "space.page.inline-sm": "2rem", // sm:px-8
  "size.content.admin": "1280px", // provider/[slug]/layout.tsx の max-w-[1280px]
  "size.content.narrow": "42rem", // max-w-2xl
  "size.content.flow": "56rem", // sm:max-w-4xl
  "size.content.flow-compact": "32rem", // max-w-lg（flow の sm 未満）
  "size.content.wide": "64rem", // max-w-5xl
  "size.content.lp": "72rem", // max-w-6xl
  // 用途の余白（peco 25_design-system.md §10-8・2026-11-21 裁定）。peco の現行値ではなく新設
  "space.inset": "1rem", // 部品の中
  "space.related": "0.5rem", // 関係が近いもの同士
  "space.group": "1.5rem", // まとまり同士の間
};
const layoutTokens = Object.fromEntries(
  Object.keys(LAYOUT_NAMESPACES).flatMap((namespace) =>
    Object.entries(flattenOverrides(dimensionJson[namespace] ?? {})).map(([k, v]) => [
      `${namespace}.${k}`,
      // 値はプリミティブ（space-scale.*）への別名なので実値に解決して比べる
      resolveDeep(v.$value),
    ])
  )
);

check("verify:layout-tokens — 値が peco の現行の描画と一致する", () => {
  eq(
    Object.keys(layoutTokens).sort().join(","),
    Object.keys(PECO_LAYOUT_VALUES).sort().join(","),
    "space / size のトークン一覧"
  );
  for (const [key, value] of Object.entries(PECO_LAYOUT_VALUES)) {
    eq(layoutTokens[key], value, key);
  }
});

const readDist = async (rel) => {
  try {
    return await readFile(join(HERE, "dist", rel), "utf8");
  } catch {
    return null;
  }
};
const themeCss = await readDist("css/theme.css");
const tokensCss = await readDist("css/tokens.css");
const primitivesCss = await readDist("css/primitives.css");
/** tokens.css を :root と reduced-motion の @media に分ける */
const [rootCss = "", reducedCss = ""] = (tokensCss ?? "").split("@media (prefers-reduced-motion: reduce)");

check("verify:layout-tokens — theme では spacing / container として出る（色ではない）", () => {
  ok(themeCss && tokensCss, "dist が無い。`pnpm build` を先に実行すること");
  ok(
    !/--color-(space|size)-/.test(themeCss),
    "space / size が色として theme に出ている（build.mjs の NON_COLOR_NAMESPACES を確認）"
  );
  for (const key of Object.keys(PECO_LAYOUT_VALUES)) {
    const [namespace, ...rest] = key.split(".");
    const rootVar = `--${namespace}-${rest.join("-")}`;
    const themeVar = `--${LAYOUT_NAMESPACES[namespace]}-${rest.join("-")}`;
    // var() 経由であること（実値だとモードで差し替えても効かない）
    ok(
      themeCss.includes(`  ${themeVar}: var(${rootVar});`),
      `theme.css に ${themeVar}: var(${rootVar}) が無い`
    );
    ok(
      tokensCss.includes(`  ${rootVar}: ${PECO_LAYOUT_VALUES[key]};`),
      `tokens.css に ${rootVar}: ${PECO_LAYOUT_VALUES[key]} が無い`
    );
  }
});

check("verify:layout-modes — space / size はモードで上書きでき、CSS 変数で出る", () => {
  const mode = {
    name: "layout-example",
    overrides: { "size.content.admin": { $value: "90rem" }, "space.page.block": { $value: "1rem" } },
  };
  assertModeOverridesSemanticOnly(mode, defaultKeys);
  const css = renderModeCss(mode, resolve);
  ok(css.includes("  --size-content-admin: 90rem;"), `size が出ない:\n${css}`);
  ok(css.includes("  --space-page-block: 1rem;"), `space が出ない:\n${css}`);
});

check("verify:layout-modes — text / radius は拒否する（theme に実値で焼き込まれ、効かない）", () => {
  throws(
    () =>
      assertModeOverridesSemanticOnly(
        { name: "x", overrides: { "radius.control": { $value: "1rem" } } },
        defaultKeys
      ),
    /text \/ radius は theme に実値で焼き込まれる/,
    "radius の上書き"
  );
  throws(
    () =>
      assertModeOverridesSemanticOnly(
        { name: "x", overrides: { "size.content.admn": { $value: "1rem" } } },
        defaultKeys
      ),
    /に無いキー/,
    "size の綴り違い"
  );
});

check("verify:layout-modes — Figma payload では FLOAT の実値（px）が書かれる", () => {
  const { payload } = buildFigmaPayload({
    primitivesJson,
    semanticJson,
    dimensionJson,
    scalePrimitivesJson,
    motionJson,
    modes: [{ name: "layout-example", overrides: { "size.content.admin": { $value: "90rem" } } }],
    defaultModeName: DEFAULT_MODE,
    existing: EMPTY,
  });
  const created = payload.variableModes.find((m) => m.action === "CREATE");
  const adminVar = payload.variables.find((v) => v.name === "size/content/admin");
  ok(adminVar, "size/content/admin の変数が作られていない");
  eq(adminVar.resolvedType, "FLOAT", "size/content/admin の型");
  const values = payload.variableModeValues.filter((v) => v.modeId === created.id);
  eq(values.length, 1, "モードに書かれる値の数");
  eq(values[0].variableId, adminVar.id, "書かれる変数");
  eq(values[0].value, 1440, "90rem → 1440");
});

// ---------------------------------------------------------------------------
// 7. 文字の階層・太さ・用途の余白（peco 25_design-system.md §10-8）
// ---------------------------------------------------------------------------

/** §10-8 の値。変えるなら §10-8 の裁定を先に変えること */
const ROLE_VALUES = {
  "text-role-heading": "1.125rem",
  "text-role-body": "0.875rem",
  "text-role-help": "0.75rem",
  "text-role-caption": "0.6875rem",
  "text-role-numeric": "1.5rem",
  "font-weight-regular": "400",
  "font-weight-emphasis": "600",
  "font-weight-strong": "700",
};

check("verify:type-roles — theme に文字の 5 段と太さの 3 種が出る", () => {
  ok(themeCss, "dist が無い。`pnpm build` を先に実行すること");
  for (const [name, value] of Object.entries(ROLE_VALUES)) {
    ok(themeCss.includes(`  --${name}: ${value};`), `theme.css に --${name}: ${value} が無い`);
  }
  // 入れ子の text.role.* が --text-role に潰れていないこと（build.mjs が path[1] だけを見ていた）
  ok(!/--text-role:/.test(themeCss), "text.role.* が --text-role に潰れている");
  // 既存の段は従来どおり
  ok(themeCss.includes("  --text-2xs: 0.6875rem;"), "--text-2xs が変わった");
  ok(themeCss.includes("  --text-3xs: 0.625rem;"), "--text-3xs が変わった");
  // 太さはフォントスタックとして出ていないこと
  ok(!/--font-weight:/.test(themeCss), "font.weight が --font-weight に潰れている");
});

check("verify:type-roles — caption は text.2xs の別名（値を二重に持たない）", () => {
  eq(dimensionJson.text.role.caption.$value, "{text.2xs}", "text.role.caption の $value");
});

/** 約束が必須のトークン（§10-8 で足したもの）。今後のトークンも足すこと */
const CONTRACT_REQUIRED_PREFIXES = [
  "text.role.",
  "font.weight.",
  "space.inset",
  "space.related",
  "space.group",
  // 動きの用途（§10-9）は全部
  "motion.",
];

check("verify:token-usage — 約束（$extensions.com.edgescrum.usage）が §10-2 の欄を満たす", () => {
  const all = [];
  const visit = (node, path) => {
    for (const [key, val] of Object.entries(node)) {
      if (key.startsWith("$") || !val || typeof val !== "object") continue;
      if ("$value" in val) all.push([[...path, key].join("."), val]);
      else visit(val, [...path, key]);
    }
  };
  visit({ ...semanticJson, ...dimensionJson, ...typographyJson, ...motionJson }, []);
  const required = all.filter(([p]) => CONTRACT_REQUIRED_PREFIXES.some((x) => p.startsWith(x)));
  // 空振り防止: 文字 5 段 + 太さ 3 種 + 余白 3 種 + 動き（時間 4 + イージング 6 + transition 7）= 28
  eq(required.length, 28, "約束が必須のトークン数");
  const problems = [];
  for (const [path, token] of all) {
    const usage = token.$extensions?.[USAGE_EXTENSION];
    const mustHave = required.some(([p]) => p === path);
    if (!usage) {
      if (mustHave) problems.push(`${path}: 約束が無い`);
      continue;
    }
    if (!token.$description) problems.push(`${path}: $description が無い`);
    for (const p of validateUsage(usage)) problems.push(`${path}: ${p}`);
  }
  ok(problems.length === 0, problems.join("\n"));
});

check("verify:token-usage — 欄の検査器が違反を拒否する（標本）", () => {
  const good = {
    purpose: "x",
    use_when: ["a"],
    dont_use_when: ["b → c"],
    never: ["d"],
    check: "evaluator",
    decided_by: "e",
  };
  eq(validateUsage(good).length, 0, "正しい標本の問題数");
  ok(validateUsage({ ...good, never: [] }).some((p) => /"never" が空/.test(p)), "never が空でも通る");
  ok(validateUsage({ ...good, dont_use_when: [] }).some((p) => /"dont_use_when" が空/.test(p)), "dont_use_when が空でも通る");
  ok(validateUsage({ ...good, dont_use_when: ["b"] }).some((p) => /→/.test(p)), "→ の無い行が通る");
  const { decided_by: _omit, ...noDecided } = good;
  ok(validateUsage(noDecided).some((p) => /decided_by/.test(p)), "decided_by が無くても通る");
  ok(validateUsage({ ...good, dont_use_wen: ["x → y"] }).some((p) => /未知の欄/.test(p)), "綴り違いの欄が通る");
});

check("verify:figma-type-roles — Figma に FLOAT で載り、役割はプリミティブの別名", () => {
  const { payload } = buildFigmaPayload({
    primitivesJson,
    semanticJson,
    dimensionJson,
    scalePrimitivesJson,
    motionJson,
    typographyJson,
    modes: [],
    defaultModeName: DEFAULT_MODE,
    existing: EMPTY,
  });
  const byName = new Map(payload.variables.map((v) => [v.name, v]));
  const byId = new Map(payload.variables.map((v) => [v.id, v]));
  const valueOf = (name) => payload.variableModeValues.find((v) => v.variableId === byName.get(name)?.id)?.value;
  const primColId = payload.variableCollections.find((c) => c.name === "Primitives").id;
  /** 別名を辿って (最後の変数名, 数値) を返す */
  const follow = (name) => {
    let v = valueOf(name);
    let at = name;
    while (v?.type === "VARIABLE_ALIAS") {
      at = byId.get(v.id).name;
      v = valueOf(at);
    }
    return [at, v];
  };
  for (const [name, prim, px] of [
    ["text/role/heading", "font-size/18", 18],
    ["text/role/body", "font-size/14", 14],
    ["text/role/help", "font-size/12", 12],
    ["text/role/numeric", "font-size/24", 24],
    ["text/2xs", "font-size/11", 11],
    ["text/3xs", "font-size/10", 10],
  ]) {
    eq(valueOf(name)?.type, "VARIABLE_ALIAS", `${name} の値の種類`);
    eq(follow(name).join("="), `${prim}=${px}`, `${name} の別名先と値`);
  }
  for (const name of ["text/role/heading", "text/role/body", "text/role/help", "text/role/numeric"]) {
    eq(byName.get(name).scopes?.join(","), "FONT_SIZE", `${name} のスコープ`);
  }
  for (const [name, prim, w] of [["font/weight/regular", "font-weight/400", 400], ["font/weight/emphasis", "font-weight/600", 600], ["font/weight/strong", "font-weight/700", 700]]) {
    eq(follow(name).join("="), `${prim}=${w}`, `${name} の別名先と値`);
    eq(byName.get(name).scopes?.join(","), "FONT_WEIGHT", `${name} のスコープ`);
  }
  const caption = valueOf("text/role/caption");
  eq(caption?.type, "VARIABLE_ALIAS", "text/role/caption の値の種類");
  eq(caption.id, byName.get("text/2xs").id, "text/role/caption の別名先");
  // 既存の text/2xs はスコープを付けない（payload の既存部分を変えない）
  eq(byName.get("text/2xs").scopes, undefined, "text/2xs のスコープ");
  for (const [name, prim, px] of [["space/inset", "space-scale/16", 16], ["space/related", "space-scale/8", 8], ["space/group", "space-scale/24", 24], ["space/page/block", "space-scale/24", 24], ["space/page/block-sm", "space-scale/32", 32]]) {
    eq(follow(name).join("="), `${prim}=${px}`, `${name} の別名先と値`);
  }
  for (const name of ["space/inset", "space/related", "space/group"]) {
    eq(byName.get(name)?.scopes?.join(","), "GAP", `${name} のスコープ`);
  }
  // プリミティブは Primitives コレクション（非公開）にある
  for (const name of ["font-size/18", "font-weight/600", "space-scale/16", "duration/250"]) {
    eq(byName.get(name)?.variableCollectionId, primColId, `${name} のコレクション`);
    eq(byName.get(name)?.resolvedType, "FLOAT", `${name} の型`);
  }
});

// ---------------------------------------------------------------------------
// 7-2. プリミティブ層とセマンティック層（文字・余白・動き）
// ---------------------------------------------------------------------------
// 色と同じ 2 層にした（color.primitives.json → color.semantic.json）。セマンティックが実値を
// 持つと、モードで「役割の割り当て」を差し替えられず、同じ値が 2 箇所に書かれて片方だけ直る。

/** セマンティック層のうち、プリミティブへの別名でなければならないもの（フォントスタックと本文幅は対象外） */
const SEMANTIC_SCALE_GROUPS = [
  ["text", dimensionJson.text],
  ["space", dimensionJson.space],
  ["font.weight", typographyJson.font.weight],
  ["motion", motionJson.motion],
];
const semanticScaleTokens = SEMANTIC_SCALE_GROUPS.flatMap(([prefix, node]) =>
  Object.entries(flattenOverrides(node)).map(([k, token]) => [`${prefix}.${k}`, token])
);

/**
 * 1 つの参照（`{…}`）を辿り、プリミティブの実値に着くことを確かめる。着いたプリミティブのパスを返す。
 * 実値に出会った時点でそこがプリミティブでなければ落とす。
 */
function assertReachesPrimitive(where, ref) {
  if (typeof ref !== "string" || !ref.startsWith("{")) {
    throw new Error(`${where}: 実値 ${JSON.stringify(ref)} を持っている（プリミティブへの別名 {…} にすること）`);
  }
  const seen = new Set();
  let at = ref;
  for (;;) {
    if (seen.has(at)) throw new Error(`${where}: 参照が循環している（${[...seen].join(" → ")}）`);
    seen.add(at);
    const node = tokenAt(at);
    const v = node.$value;
    if (typeof v === "string" && v.startsWith("{")) {
      at = v;
      continue;
    }
    const path = at.slice(1, -1);
    if (!PRIMITIVE_NAMESPACES.includes(path.split(".")[0])) {
      throw new Error(`${where}: ${ref} の行き先 ${at} はプリミティブではないのに実値を持っている`);
    }
    return path;
  }
}

/** セマンティックの 1 トークンを検査する（transition は 3 つの欄それぞれ）。問題の一覧を返す */
function semanticAliasProblems(path, token) {
  const problems = [];
  const refs =
    token.$type === "transition" && token.$value && typeof token.$value === "object"
      ? Object.entries(token.$value).map(([k, v]) => [`${path}.${k}`, v])
      : [[path, token.$value]];
  for (const [where, ref] of refs) {
    try {
      assertReachesPrimitive(where, ref);
    } catch (err) {
      problems.push(err.message);
    }
  }
  return problems;
}

check("verify:semantic-aliases — 文字・余白・動きのセマンティックはすべてプリミティブへの別名", () => {
  // 空振り防止: text 7（2xs・3xs・役割 5）+ space 7（page 4・用途 3）+ font.weight 3 + motion 17 = 34
  eq(semanticScaleTokens.length, 34, "検査対象のセマンティックトークン数");
  const problems = semanticScaleTokens.flatMap(([path, token]) => semanticAliasProblems(path, token));
  ok(problems.length === 0, problems.join("\n"));
});

check("verify:semantic-aliases — 検査器が実値・行き先違いを拒否する（標本）", () => {
  eq(semanticAliasProblems("x", { $value: "{font-size.14}" }).length, 0, "正しい別名の問題数");
  eq(semanticAliasProblems("x", { $value: "{text.role.caption}" }).length, 0, "セマンティック経由の別名の問題数");
  ok(semanticAliasProblems("x", { $value: "0.875rem" }).some((p) => /実値/.test(p)), "実値が通る");
  ok(semanticAliasProblems("x", { $value: "{size.content.admin}" }).some((p) => /プリミティブではない/.test(p)), "本文幅（実値のセマンティック）への別名が通る");
  ok(
    semanticAliasProblems("x", {
      $type: "transition",
      $value: { duration: "250ms", delay: "{duration.0}", timingFunction: "{motion.productive.enter}" },
    }).some((p) => /x\.duration: 実値/.test(p)),
    "transition の欄の実値が通る"
  );
});

check("verify:primitives — プリミティブは実値で、theme に出ない（Tailwind のユーティリティを生やさない）", () => {
  ok(themeCss && tokensCss, "dist が無い。`pnpm build` を先に実行すること");
  const primitives = PRIMITIVE_NAMESPACES.filter((n) => n !== "color").flatMap((n) =>
    Object.entries(flattenOverrides(scalePrimitivesJson[n] ?? {})).map(([k, t]) => [`${n}.${k}`, t])
  );
  // 空振り防止: font-size 10 + font-weight 4 + space-scale 9 + duration 5 + easing 6 = 34
  eq(primitives.length, 34, "色以外のプリミティブ数");
  for (const [path, token] of primitives) {
    ok(!(typeof token.$value === "string" && token.$value.startsWith("{")), `${path} が別名になっている（プリミティブは実値）`);
    ok(token.$description, `${path} に $description が無い`);
  }
  for (const [path] of primitives) {
    // --font-weight-regular（セマンティック）と --font-weight-400（プリミティブ）は接頭辞が同じなので、
    // 名前の全体で見る
    const name = `--${path.split(".").join("-")}:`;
    ok(!themeCss.includes(name), `プリミティブ ${path} が theme.css に出ている`);
    ok(primitivesCss?.includes(`  ${name}`), `プリミティブ ${path} が primitives.css に無い`);
    ok(!rootCss.includes(`  ${name}`), `プリミティブ ${path} が tokens.css（セマンティック）に出ている`);
  }
  // 余白の段を --spacing-<数字> に出すと Tailwind の p-16（= 4rem）の意味が変わる
  ok(!/--spacing-\d/.test(themeCss), "theme.css に --spacing-<数字> が出ている（Tailwind 標準の段を上書きする）");
});

check("verify:primitives — 文字サイズは使われている段を網羅し、text.2xs / 3xs の値は変わらない", () => {
  const px = Object.keys(scalePrimitivesJson["font-size"]).filter((k) => !k.startsWith("$"));
  eq(px.join(","), "10,11,12,14,16,18,20,24,30,36", "font-size の段");
  eq(resolveDeep(dimensionJson.text["2xs"].$value), "0.6875rem", "text.2xs の値");
  eq(resolveDeep(dimensionJson.text["3xs"].$value), "0.625rem", "text.3xs の値");
  const space = Object.keys(scalePrimitivesJson["space-scale"]).filter((k) => !k.startsWith("$"));
  eq(space.join(","), "4,8,12,16,20,24,32,40,48", "space-scale の段（4px グリッド）");
  for (const k of space) ok(Number(k) % 4 === 0, `space-scale.${k} が 4px グリッドに乗っていない`);
});

// ---------------------------------------------------------------------------
// 7-3. 動き（peco 25_design-system.md §10-9）
// ---------------------------------------------------------------------------
const motionTokens = Object.entries(flattenOverrides(motionJson.motion)).map(([k, t]) => [`motion.${k}`, t]);
const MOTION_DURATIONS = { "state-change": "100ms", feedback: "150ms", surface: "250ms", screen: "400ms" };
const MOTION_TRANSITIONS = {
  "page-forward": ["400ms", "productive-standard"],
  "page-back": ["400ms", "productive-standard"],
  "sheet-enter": ["250ms", "productive-enter"],
  "sheet-exit": ["250ms", "productive-exit"],
  "modal-enter": ["250ms", "productive-enter"],
  "modal-exit": ["250ms", "productive-exit"],
  "tab-switch": ["150ms", "productive-standard"],
};
const CARBON = {
  "productive-standard": "cubic-bezier(0.2, 0, 0.38, 0.9)",
  "productive-enter": "cubic-bezier(0, 0, 0.38, 0.9)",
  "productive-exit": "cubic-bezier(0.2, 0, 1, 0.9)",
  "expressive-standard": "cubic-bezier(0.4, 0.14, 0.3, 1)",
  "expressive-enter": "cubic-bezier(0, 0, 0.3, 1)",
  "expressive-exit": "cubic-bezier(0.4, 0.14, 1, 1)",
};

check("verify:motion-tokens — 時間・イージング・transition が :root と theme に出る", () => {
  ok(themeCss && tokensCss, "dist が無い。`pnpm build` を先に実行すること");
  for (const [name, ms] of Object.entries(MOTION_DURATIONS)) {
    ok(rootCss.includes(`  --motion-duration-${name}: ${ms};`), `tokens.css に --motion-duration-${name}: ${ms} が無い`);
    // var() 経由（reduced-motion の @media で 0ms に差し替えるため）
    ok(
      themeCss.includes(`  --transition-duration-${name}: var(--motion-duration-${name});`),
      `theme.css に --transition-duration-${name}（Tailwind の duration-${name}）が無い`
    );
  }
  for (const [name, css] of Object.entries(CARBON)) {
    ok(rootCss.includes(`  --motion-${name}: ${css};`), `tokens.css に --motion-${name}: ${css} が無い`);
    ok(themeCss.includes(`  --ease-${name}: var(--motion-${name});`), `theme.css に --ease-${name}（Tailwind の ease-${name}）が無い`);
  }
  for (const [name, [ms, ease]] of Object.entries(MOTION_TRANSITIONS)) {
    const line = `  --motion-transition-${name}: ${ms} ${CARBON[ease]} 0ms;`;
    ok(rootCss.includes(line), `tokens.css に ${line.trim()} が無い`);
  }
  // transition は Tailwind に受け皿が無いので theme に出さない（色として出ていないことも見る）
  ok(!/--[a-z-]*transition-(page|sheet|modal|tab)/.test(themeCss), "transition が theme.css に出ている");
  ok(!/--color-motion-/.test(themeCss), "motion が色として theme.css に出ている（NON_COLOR_NAMESPACES を確認）");
  eq(motionTokens.length, 17, "motion のトークン数");
});

check("verify:motion-reduced — 動きは prefers-reduced-motion で 0ms、色・不透明度だけが 150ms 以下で残る", () => {
  ok(reducedCss, "tokens.css に @media (prefers-reduced-motion: reduce) が無い");
  const timed = motionTokens.filter(([, t]) => t.$type === "duration" || t.$type === "transition");
  eq(timed.length, 11, "時間を持つ motion トークン数（時間 4 + transition 7）");
  const problems = [];
  for (const [path, token] of timed) {
    const mode = token.$extensions?.[REDUCED_MOTION_EXTENSION];
    const varName = `--${path.split(".").join("-")}`;
    const inReduced = new RegExp(`\\n {4}${varName}: 0ms[ ;]`).test(reducedCss);
    if (mode === "remove") {
      if (!inReduced) problems.push(`${path}: remove なのに @media で 0ms になっていない`);
    } else if (mode === "keep") {
      if (reducedCss.includes(`${varName}:`)) problems.push(`${path}: keep なのに @media で上書きされている`);
      const ms = Number(String(resolveDeep(token.$type === "transition" ? token.$value.duration : token.$value)).replace(/ms$/, ""));
      if (!(ms <= 150)) problems.push(`${path}: keep（動きを減らす設定でも残る）なのに ${ms}ms。150ms 以下にする`);
    } else {
      problems.push(`${path}: $extensions["${REDUCED_MOTION_EXTENSION}"] が remove / keep のどちらでもない（${mode}）`);
    }
  }
  ok(problems.length === 0, problems.join("\n"));
  // 色・不透明度の時間は残る / 動きの時間は消える（§10-9 の要点を名指しで）
  ok(!reducedCss.includes("--motion-duration-feedback"), "feedback（色・不透明度）が 0ms にされている");
  for (const name of ["state-change", "surface", "screen"]) {
    ok(reducedCss.includes(`    --motion-duration-${name}: 0ms;`), `${name} が 0ms にされていない`);
  }
  // イージングは時間ではないので上書きしない
  ok(!/--motion-(productive|expressive)-/.test(reducedCss.split("\n").filter((l) => !l.includes("transition")).join("\n")), "イージングが @media で上書きされている");
});

check("verify:motion-contracts — expressive は作業画面で使わないと約束に書かれている", () => {
  const expressive = motionTokens.filter(([p]) => p.startsWith("motion.expressive."));
  eq(expressive.length, 3, "expressive のトークン数");
  for (const [path, token] of expressive) {
    const usage = token.$extensions?.[USAGE_EXTENSION];
    ok(usage?.never?.some((l) => /作業画面/.test(l) && /expressive/.test(l)), `${path} の never に「作業画面で expressive を使わない」が無い`);
    ok(usage?.dont_use_when?.some((l) => /作業画面.*→\s*motion\.productive\./.test(l)), `${path} の dont_use_when に「作業画面 → motion.productive.*」が無い`);
  }
  for (const [path, token] of motionTokens) {
    eq(token.$extensions?.[USAGE_EXTENSION]?.decided_by, "peco docs/v2/requirements/25_design-system.md §10-9", `${path} の decided_by`);
  }
});

check("verify:figma-motion — 時間は FLOAT（ms）で写り、イージング・transition は明示的に飛ばす", () => {
  const { payload, stats } = buildFigmaPayload({
    primitivesJson,
    semanticJson,
    dimensionJson,
    scalePrimitivesJson,
    motionJson,
    typographyJson,
    modes: [],
    defaultModeName: DEFAULT_MODE,
    existing: EMPTY,
  });
  const byName = new Map(payload.variables.map((v) => [v.name, v]));
  const valueOf = (name) => payload.variableModeValues.find((v) => v.variableId === byName.get(name)?.id)?.value;
  for (const ms of [0, 100, 150, 250, 400]) {
    eq(valueOf(`duration/${ms}`), ms, `duration/${ms} の値`);
    eq(byName.get(`duration/${ms}`).scopes?.length, 0, `duration/${ms} のスコープ（どのピッカーにも出さない）`);
  }
  for (const [name, ms] of Object.entries(MOTION_DURATIONS)) {
    const v = valueOf(`motion/duration/${name}`);
    eq(v?.type, "VARIABLE_ALIAS", `motion/duration/${name} の値の種類`);
    eq(v.id, byName.get(`duration/${parseInt(ms, 10)}`).id, `motion/duration/${name} の別名先`);
    eq(byName.get(`motion/duration/${name}`).scopes?.length, 0, `motion/duration/${name} のスコープ`);
  }
  // 飛ばしたもの: easing 6（プリミティブ）+ productive / expressive 6 + transition 7 = 19
  eq(stats.skipped.length, 19, "Figma に写さなかったトークン数");
  ok(stats.skipped.every((t) => FIGMA_UNSUPPORTED_TYPES.includes(t.type)), `飛ばした型: ${JSON.stringify(stats.skipped)}`);
  ok(
    !payload.variables.some((v) => /^(easing\/|motion\/(productive|expressive|transition)\/)/.test(v.name)),
    "イージング・transition の変数が作られている"
  );
});

check("verify:mode-guard — 色以外のプリミティブと motion もモードで上書きできない", () => {
  throws(
    () => assertModeOverridesSemanticOnly({ name: "x", overrides: { "font-size.14": {} } }, defaultKeys),
    /primitives はモードを持たない/,
    "font-size への侵入"
  );
  throws(
    () => assertModeOverridesSemanticOnly({ name: "x", overrides: { "duration.250": {} } }, defaultKeys),
    /primitives はモードを持たない/,
    "duration への侵入"
  );
  throws(
    () => assertModeOverridesSemanticOnly({ name: "x", overrides: { "motion.duration.surface": {} } }, defaultKeys),
    /motion はまだモードの対象外/,
    "motion の上書き"
  );
});

// ---------------------------------------------------------------------------
// 8. DESIGN.md（ADR-0032 / peco 25_design-system.md §10-3〜§10-5）
// ---------------------------------------------------------------------------
const designMdPath = join(HERE, "DESIGN.md");
const designMd = await readFile(designMdPath, "utf8").catch(() => null);
const expectedFm = await expectedFrontmatter(HERE, await foundationTokens(HERE));
const refResult = designMd ? await checkRefs(designMdPath) : null;
const contractFiles = await Promise.all(
  (await findContractFiles(HERE)).map(async (file) => ({ file, text: await readFile(file, "utf8") }))
);

check("verify:design-md-frontmatter — 先頭 YAML が DTCG からの生成結果と一致する（手で触らない）", () => {
  ok(designMd, "packages/tokens/DESIGN.md が無い");
  const { frontmatter, body } = splitDesignMd(designMd);
  ok(frontmatter, "先頭 YAML が無い（`pnpm build` を CI 以外で実行すると書き込まれる）");
  ok(
    frontmatter === expectedFm,
    "先頭 YAML が DTCG からの生成結果と違う。手で直さず、DTCG を直して `pnpm build` する\n" +
      firstDiff(frontmatter, expectedFm)
  );
  ok(/^## Never/m.test(body), "本文の冒頭に ## Never（パッケージ全体の never）が無い");
  // 空振り防止: 生成結果に今回のトークンが載っていること
  ok(expectedFm.includes("  role:\n    heading:\n      fontSize: \"1.125rem\""), "typography.role.heading が生成されていない");
  ok(expectedFm.includes("  inset: \"1rem\""), "spacing.inset が生成されていない");
  ok(expectedFm.includes("\n    size:\n      \"10\":\n        fontSize: \"0.625rem\""), "typography.scale.size が生成されていない");
  ok(expectedFm.includes("\n  scale:\n    \"4\": \"0.25rem\""), "spacing.scale が生成されていない");
  ok(
    expectedFm.includes("\nmotion:\n  duration-state-change:\n    duration: \"100ms\""),
    "motion（DESIGN.md 仕様の motion 節）が生成されていない"
  );
  ok(
    expectedFm.includes('  transition-sheet-enter:\n    duration: "250ms"\n    delay: "0ms"\n    timingFunction: "cubic-bezier(0, 0, 0.38, 0.9)"'),
    "motion.transition-sheet-enter が生成されていない"
  );
});

check("verify:design-md-refs — `@path` の参照先がすべて存在する", () => {
  ok(refResult, "DESIGN.md が無い");
  ok(refResult.refs.length >= 3, `参照が少なすぎる（${refResult.refs.length} 件）。走査が空振りしている`);
  ok(refResult.problems.length === 0, refResult.problems.join("\n"));
});

// foundation の *.design.md（ガイドライン・§10-6 の 6）はまだ 0 件。置いた時点からこの検査が効く
check("verify:design-contract — *.design.md が §10-2 の必須欄を満たし、DESIGN.md から辿れる", () => {
  const problems = [];
  for (const { file, text } of contractFiles) {
    const rel = file.slice(HERE.length + 1);
    const { problems: p } = parseContract(text);
    problems.push(...p.map((x) => `${rel}: ${x}`));
    if (!refResult?.reached.has(file)) problems.push(`${rel}: DESIGN.md から @path で参照されていない`);
  }
  ok(problems.length === 0, problems.join("\n"));
});

/** 2 つの文字列の最初に違う行を見せる（frontmatter の差分を読みやすく） */
function firstDiff(a = "", b = "") {
  const x = (a ?? "").split("\n");
  const y = b.split("\n");
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] !== y[i]) return `${i + 1} 行目\n  実際: ${x[i]}\n  期待: ${y[i]}`;
  }
  return "";
}

console.log(`\nトークン検査 ${failed === 0 ? "全件 PASS" : `${failed} 件 FAIL`}`);
process.exit(failed === 0 ? 0 : 1);

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
  MODES_DIR,
  TOKENS_SOURCE_GLOB,
  assertModeOverridesSemanticOnly,
  flattenOverrides,
  loadModes,
  renderModeCss,
} from "./modes.mjs";
import { buildFigmaPayload } from "./scripts/figma-payload.mjs";

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

/** DTCG ツリーのトークンパス（ドット区切り）を集める。 */
function tokenPaths(node, path = [], out = new Set()) {
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (val && typeof val === "object" && "$value" in val) out.add([...path, key].join("."));
    else if (val && typeof val === "object") tokenPaths(val, [...path, key], out);
  }
  return out;
}
const defaultKeys = tokenPaths(semanticJson);

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
  ok(defaultKeys.size >= 30, `semantic のトークンが少なすぎる（${defaultKeys.size} 件）`);
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
    /既定（color\.semantic\.json）に無いキー/,
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
        modes: [{ name: "bad", overrides: { nope: { $value: "#000000" } } }],
        defaultModeName: DEFAULT_MODE,
        existing: EMPTY,
      }),
    /対応する変数が見つかりません/,
    "既定に無いキー"
  );
});

console.log(`\nトークン検査 ${failed === 0 ? "全件 PASS" : `${failed} 件 FAIL`}`);
process.exit(failed === 0 ? 0 : 1);

/**
 * Figma Variables の POST payload を組み立てる**純関数**。
 *
 * ## なぜ sync-figma.mjs から切り出したか
 *
 * 以前は payload の組み立てが `fetch` と同じスクリプトに混ざっていたため、
 * **ネットワークなしでは 1 行も検証できなかった。** その結果:
 *
 *   - docstring は「コレクション "Semantic"（モード "Light"）」と書いているのに、
 *     **モード名を設定するコードは空のループ**（`.forEach(() => {})`）で、
 *     Figma 側は既定の "Mode 1" のままだった。モードが 1 本のあいだ誰も困らないので
 *     **1 年近く誰も気づかなかった**
 *
 * モードを複数持つ以上、payload の正しさは機械で確かめる必要がある。
 * ここは「既存の Figma 状態 + トークン → payload」の変換だけを持ち、
 * IO は `sync-figma.mjs` に残してある。`verify.mjs` が合成した「既存状態」を
 * 与えてこの関数を直接呼ぶ。
 */
import { isLayoutKey } from "../modes.mjs";

/** #rrggbb または oklch(L% C H) → Figma の RGBA (0..1) */
export function cssColorToRgba(value) {
  const hex = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
  }
  const ok = /^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)$/i.exec(value.trim());
  if (ok) return oklchToRgba(Number(ok[1]) / 100, Number(ok[2]), Number(ok[3]));
  throw new Error(`色値が #rrggbb / oklch(L% C H) 形式ではありません: ${value}`);
}

/**
 * OKLCH → sRGB。Björn Ottosson の OKLab 定義の標準行列
 * (https://bottosson.github.io/posts/oklab/) をそのまま実装。
 * Tailwind v4 パレットの oklch をブラウザが sRGB 画面に描くのと同じ値になる。
 */
export function oklchToRgba(L, C, H) {
  const rad = (H * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const gamma = (c) => {
    const v = Math.min(1, Math.max(0, c));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  };
  return { r: gamma(lin[0]), g: gamma(lin[1]), b: gamma(lin[2]), a: 1 };
}

/** DTCG ツリーを {path[], value, description} のリストに展開（$type: color のみ） */
export function flattenColors(node, path = []) {
  const out = [];
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (val && typeof val === "object" && "$value" in val) {
      if (val.$type === "color") {
        out.push({ path: [...path, key], value: val.$value, description: val.$description ?? "" });
      }
    } else if (val && typeof val === "object") {
      out.push(...flattenColors(val, [...path, key]));
    }
  }
  return out;
}

/** `0.75rem` / `1280px` → Figma の数値（単位なし px）。rem は ×16。 */
export function dimensionToNumber(value) {
  const m = /^([\d.]+)(px|rem)$/.exec(value);
  if (!m) throw new Error(`dimension が px/rem 形式ではありません: ${value}`);
  return Number(m[1]) * (m[2] === "rem" ? 16 : 1);
}

/**
 * DTCG ツリーの $type: dimension を FLOAT トークンに展開する。
 * Figma の数値 Variable は単位なし px なので、rem は ×16 で換算する
 * （radius/control 0.75rem → 12 等）。
 */
export function flattenDimensions(node, path = [], root = node) {
  const out = [];
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (val && typeof val === "object" && "$value" in val) {
      if (val.$type === "dimension" || val.$type === "fontWeight") {
        // 別名（text.role.caption = {text.2xs}）は Figma でも別名（VARIABLE_ALIAS）にする。
        // 値を写すと text/2xs を変えたときに caption だけ取り残される
        const aliasOf =
          typeof val.$value === "string" && val.$value.startsWith("{") ? val.$value.slice(1, -1) : null;
        out.push({
          path: [...path, key],
          number: aliasOf ? resolveNumber(root, aliasOf) : toNumber(val),
          description: val.$description ?? "",
          ...(aliasOf ? { dimensionAliasOf: aliasOf } : {}),
        });
      }
    } else if (val && typeof val === "object") {
      out.push(...flattenDimensions(val, [...path, key], root));
    }
  }
  return out;
}

/** fontWeight（400 等の数値）はそのまま、dimension は px の数値に。 */
const toNumber = (token) =>
  token.$type === "fontWeight" ? Number(token.$value) : dimensionToNumber(token.$value);

/** `text.2xs` → 同じツリーの中の実値（px の数値）。 */
function resolveNumber(root, dotted) {
  let node = root;
  for (const key of dotted.split(".")) {
    node = node?.[key];
    if (!node) throw new Error(`参照が解決できません: {${dotted}}`);
  }
  if (!("$value" in node)) throw new Error(`参照先がトークンではありません: {${dotted}}`);
  if (typeof node.$value === "string" && node.$value.startsWith("{")) {
    return resolveNumber(root, node.$value.slice(1, -1));
  }
  return toNumber(node);
}

/**
 * payload を組み立てる。
 *
 * @param {object} input
 * @param {object} input.primitivesJson tokens/color.primitives.json の中身
 * @param {object} input.semanticJson   tokens/color.semantic.json の中身
 * @param {object} input.dimensionJson  tokens/dimension.json の中身
 * @param {object} [input.typographyJson] tokens/typography.json の中身（font.weight.* を FLOAT で同期）
 * @param {Array<{name: string, overrides: object}>} input.modes tokens/modes/*.json
 * @param {string} input.defaultModeName 既定モードの名前（"Base"）
 * @param {object} input.existing GET /variables/local の `meta`（新規ファイルなら空の形）
 * @returns {{payload: object, stats: object}}
 */
export function buildFigmaPayload({
  primitivesJson,
  semanticJson,
  dimensionJson,
  typographyJson = {},
  modes = [],
  defaultModeName,
  existing,
}) {
  const primitives = flattenColors(primitivesJson);
  const semantics = flattenColors(semanticJson).map((t) => ({ ...t, path: ["color", ...t.path] }));
  // 別名は参照先より後に並べる（参照先の変数 id が先に決まっている必要がある）。
  // 別名でないものの並びは従来どおり
  const allDimensions = [
    ...flattenDimensions(dimensionJson),
    // 太さ（§10-8 の 3 種）。フォントスタックは Figma の数値 Variable にならないので載せない
    ...flattenDimensions(typographyJson),
  ];
  const dimensions = [
    ...allDimensions.filter((t) => !t.dimensionAliasOf),
    ...allDimensions.filter((t) => t.dimensionAliasOf),
  ];

  // セマンティックの {color.x.y} 参照をプリミティブの実値に解決する
  const primitiveByRef = new Map(
    primitives.map((t) => [`{color.${t.path.slice(1).join(".")}}`, t.value])
  );
  for (const t of semantics) {
    if (t.value.startsWith("{")) {
      const resolved = primitiveByRef.get(t.value);
      if (!resolved) throw new Error(`参照が解決できません: ${t.value}`);
      t.aliasOf = t.value;
      t.value = resolved;
    }
  }

  const collectionsByName = new Map(
    Object.values(existing.variableCollections ?? {}).map((c) => [c.name, c])
  );
  const variablesByKey = new Map(
    Object.values(existing.variables ?? {}).map((v) => [`${v.variableCollectionId}:${v.name}`, v])
  );

  const payload = {
    variableCollections: [],
    variableModes: [],
    variableModeValues: [],
    variables: [],
  };
  let tempId = 0;

  function planCollection(name, hidden) {
    const found = collectionsByName.get(name);
    if (found) return { id: found.id, name, modeId: found.defaultModeId, found };
    const id = `temp_col_${tempId++}`;
    payload.variableCollections.push({
      action: "CREATE",
      id,
      name,
      hiddenFromPublishing: hidden,
      initialModeId: `temp_mode_${id}`,
    });
    return { id, name, modeId: `temp_mode_${id}`, created: true };
  }

  const SCOPES_BY_NAMESPACE = { space: ["GAP"], size: ["WIDTH_HEIGHT"] };
  /**
   * 名前空間より細かい単位のスコープ（§10-8 で足した役割トークン）。既存の text/2xs 等は
   * 従来どおり（= スコープ指定なし）にしておき、payload の既存部分を変えない
   */
  const SCOPES_BY_PREFIX = { "text.role": ["FONT_SIZE"], "font.weight": ["FONT_WEIGHT"] };
  const scopesFor = (path) =>
    SCOPES_BY_PREFIX[path.slice(0, 2).join(".")] ?? SCOPES_BY_NAMESPACE[path[0]];

  function planVariables(tokens, collection, primitiveVarIds, pathIds = null) {
    const ids = new Map();
    for (const t of tokens) {
      const name = t.path.join("/");
      const found = variablesByKey.get(`${collection.id}:${name}`);
      let varId = found?.id;
      const isFloat = typeof t.number === "number";
      if (!found) {
        varId = `temp_var_${tempId++}`;
        payload.variables.push({
          action: "CREATE",
          id: varId,
          name,
          variableCollectionId: collection.id,
          resolvedType: isFloat ? "FLOAT" : "COLOR",
          description: t.description,
          // ★ 既定の ALL_SCOPES だと、余白や幅の変数が色・角丸・文字サイズのピッカーにまで並ぶ。
          //   ページ余白（space/*）は auto layout の gap / padding、本文幅（size/*）は幅・高さに限る。
          //   作成時にだけ付ける（既存変数は Figma 側で手で絞った値を上書きしない）
          ...(scopesFor(t.path) ? { scopes: scopesFor(t.path) } : {}),
        });
      }
      // セマンティックはプリミティブ変数への alias、プリミティブ・数値は実値
      const aliasTarget =
        (t.aliasOf && primitiveVarIds?.get(t.aliasOf)) ||
        (t.dimensionAliasOf && pathIds?.get(t.dimensionAliasOf));
      if (t.dimensionAliasOf && !aliasTarget) {
        throw new Error(`${name} の別名先 {${t.dimensionAliasOf}} の変数が見つかりません`);
      }
      payload.variableModeValues.push({
        variableId: varId,
        modeId: collection.modeId,
        value: aliasTarget
          ? { type: "VARIABLE_ALIAS", id: aliasTarget }
          : isFloat
            ? t.number
            : cssColorToRgba(t.value),
      });
      ids.set(`{color.${t.path.slice(1).join(".")}}`, varId);
      // dimension（space.page.block 等）はモードがドット区切りのパスで引く
      pathIds?.set(t.path.join("."), varId);
    }
    return ids;
  }

  /**
   * 既定モードに名前を付ける。
   *
   * ★ **以前はここが空のループで、モード名は一度も設定されていなかった。**
   *   docstring だけが「モード Light」と言っていた（`figma-payload.mjs` の冒頭を読むこと）。
   */
  function planDefaultModeName(collection) {
    if (collection.created) {
      payload.variableModes.push({
        action: "UPDATE",
        id: collection.modeId,
        name: defaultModeName,
        variableCollectionId: collection.id,
      });
      return;
    }
    const current = collection.found?.modes?.find((m) => m.modeId === collection.modeId);
    if (current && current.name !== defaultModeName) {
      payload.variableModes.push({
        action: "UPDATE",
        id: collection.modeId,
        name: defaultModeName,
        variableCollectionId: collection.id,
      });
    }
  }

  /**
   * セマンティックのモードを作り、差分の値だけを書く。
   *
   * ★ **primitives には足さない**（ADR 0026 Decision 3）。
   *   この関数は Semantic コレクションだけを受け取る形にしてある。
   */
  function planSemanticModes(semCol, semanticVarIds, primitiveVarIds) {
    for (const mode of modes) {
      const existingMode = semCol.found?.modes?.find((m) => m.name === mode.name);
      let modeId = existingMode?.modeId;
      if (!modeId) {
        modeId = `temp_mode_${tempId++}`;
        payload.variableModes.push({
          action: "CREATE",
          id: modeId,
          name: mode.name,
          variableCollectionId: semCol.id,
        });
      }
      for (const [key, token] of Object.entries(mode.overrides)) {
        // ページ余白 / 本文幅（ADR 0027）は FLOAT 変数。値は実値（rem/px → px の数値）
        if (isLayoutKey(key)) {
          const varId = dimensionVarIds.get(key);
          if (!varId) {
            throw new Error(
              `モード "${mode.name}" の ${key} に対応する変数が見つかりません（索引キー: ${key}）`
            );
          }
          payload.variableModeValues.push({
            variableId: varId,
            modeId,
            value: dimensionToNumber(token.$value),
          });
          continue;
        }
        const ref = `{color.${key}}`;
        const varId = semanticVarIds.get(ref);
        if (!varId) {
          // build.mjs の assertModeOverridesSemanticOnly が先に落とすので、
          // ここに来るのは索引の作り方がずれたとき。黙って飛ばさない。
          throw new Error(
            `モード "${mode.name}" の ${key} に対応する変数が見つかりません（索引キー: ${ref}）`
          );
        }
        const isRef = token.$value.startsWith("{");
        const aliasTarget = isRef ? primitiveVarIds.get(token.$value) : null;
        if (isRef && !aliasTarget) {
          throw new Error(`モード "${mode.name}" の ${key}: 参照が解決できません: ${token.$value}`);
        }
        payload.variableModeValues.push({
          variableId: varId,
          modeId,
          value: aliasTarget
            ? { type: "VARIABLE_ALIAS", id: aliasTarget }
            : cssColorToRgba(token.$value),
        });
      }
    }
  }

  const primCol = planCollection("Primitives", true);
  const semCol = planCollection("Semantic", false);
  const primitiveVarIds = planVariables(primitives, primCol);
  const semanticVarIds = planVariables(semantics, semCol, primitiveVarIds);
  // 役割トークン（radius/* text/* と ADR 0027 の space/* size/*・§10-8 の font/weight/*）は
  // Semantic コレクションの FLOAT 変数
  const dimensionVarIds = new Map();
  planVariables(dimensions, semCol, undefined, dimensionVarIds);

  planDefaultModeName(primCol);
  planDefaultModeName(semCol);
  planSemanticModes(semCol, semanticVarIds, primitiveVarIds);

  return {
    payload,
    stats: {
      collectionsCreated: payload.variableCollections.length,
      modesPlanned: payload.variableModes.length,
      variablesCreated: payload.variables.length,
      valuesSet: payload.variableModeValues.length,
      modeNames: modes.map((m) => m.name),
    },
  };
}

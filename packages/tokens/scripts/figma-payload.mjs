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

/**
 * DTCG ツリーの $type: dimension を FLOAT トークンに展開する。
 * Figma の数値 Variable は単位なし px なので、rem は ×16 で換算する
 * （radius/control 0.75rem → 12 等）。
 */
export function flattenDimensions(node, path = []) {
  const out = [];
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (val && typeof val === "object" && "$value" in val) {
      if (val.$type === "dimension") {
        const m = /^([\d.]+)(px|rem)$/.exec(val.$value);
        if (!m) throw new Error(`dimension が px/rem 形式ではありません: ${val.$value}`);
        out.push({
          path: [...path, key],
          number: Number(m[1]) * (m[2] === "rem" ? 16 : 1),
          description: val.$description ?? "",
        });
      }
    } else if (val && typeof val === "object") {
      out.push(...flattenDimensions(val, [...path, key]));
    }
  }
  return out;
}

/**
 * payload を組み立てる。
 *
 * @param {object} input
 * @param {object} input.primitivesJson tokens/color.primitives.json の中身
 * @param {object} input.semanticJson   tokens/color.semantic.json の中身
 * @param {object} input.dimensionJson  tokens/dimension.json の中身
 * @param {Array<{name: string, overrides: object}>} input.modes tokens/modes/*.json
 * @param {string} input.defaultModeName 既定モードの名前（"Base"）
 * @param {object} input.existing GET /variables/local の `meta`（新規ファイルなら空の形）
 * @returns {{payload: object, stats: object}}
 */
export function buildFigmaPayload({
  primitivesJson,
  semanticJson,
  dimensionJson,
  modes = [],
  defaultModeName,
  existing,
}) {
  const primitives = flattenColors(primitivesJson);
  const semantics = flattenColors(semanticJson).map((t) => ({ ...t, path: ["color", ...t.path] }));
  const dimensions = flattenDimensions(dimensionJson);

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

  function planVariables(tokens, collection, primitiveVarIds) {
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
        });
      }
      // セマンティックはプリミティブ変数への alias、プリミティブ・数値は実値
      const aliasTarget = t.aliasOf && primitiveVarIds?.get(t.aliasOf);
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
  // 役割トークン（radius/* text/*）は Semantic コレクションの FLOAT 変数
  planVariables(dimensions, semCol);

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

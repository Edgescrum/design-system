/**
 * トークン JSON → Figma Variables 一方向同期（コードが正・Figma は写し）。
 *
 * 対応関係:
 *   tokens/color.primitives.json  → コレクション "Primitives"（hiddenFromPublishing）
 *   tokens/color.semantic.json    → コレクション "Semantic"（publish 対象・モード "Light"）
 *   変数名はトークンパスから機械導出（color.salmon.500 → color/salmon/500、
 *   セマンティックは background → color/background）。手で命名しないこと。
 *
 * 必要な環境変数:
 *   FIGMA_TOKEN     — Personal Access Token（scope: file_variables:read, file_variables:write。
 *                     Variables の書き込みは Figma Enterprise プランでのみ許可される）
 *   FIGMA_FILE_KEY  — ライブラリファイル（PeCo Design System）のファイルキー
 *
 * 冪等: 既存の同名コレクション・変数は valuesByMode の更新のみ行い、無ければ作成する。
 * Figma 側にしか無い変数は削除しない（写し以外のものを壊さないため）。削除が必要に
 * なったら --prune を実装すること。
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "tokens");
const API = "https://api.figma.com/v1";

const { FIGMA_TOKEN, FIGMA_FILE_KEY } = process.env;
if (!FIGMA_TOKEN || !FIGMA_FILE_KEY) {
  console.error("FIGMA_TOKEN / FIGMA_FILE_KEY が未設定です。同期をスキップします。");
  process.exit(process.env.CI ? 0 : 1);
}

/** #rrggbb → Figma の RGBA (0..1) */
function hexToRgba(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`色値が #rrggbb 形式ではありません: ${hex}`);
  const n = parseInt(m[1], 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
}

/** DTCG ツリーを {path[], value, description} のリストに展開（$type: color のみ） */
function flattenColors(node, path = []) {
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

async function figma(method, url, body) {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: { "X-Figma-Token": FIGMA_TOKEN, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`Figma API ${method} ${url} failed (${res.status}): ${JSON.stringify(json).slice(0, 500)}`);
  }
  return json;
}

const primitives = flattenColors(JSON.parse(await readFile(join(TOKEN_DIR, "color.primitives.json"), "utf8")));
const semanticRaw = JSON.parse(await readFile(join(TOKEN_DIR, "color.semantic.json"), "utf8"));
const semantics = flattenColors(semanticRaw).map((t) => ({ ...t, path: ["color", ...t.path] }));

/** セマンティックの {color.x.y} 参照をプリミティブの実値に解決する */
const primitiveByRef = new Map(primitives.map((t) => [`{color.${t.path.slice(1).join(".")}}`, t.value]));
for (const t of semantics) {
  if (t.value.startsWith("{")) {
    const resolved = primitiveByRef.get(t.value);
    if (!resolved) throw new Error(`参照が解決できません: ${t.value}`);
    t.aliasOf = t.value;
    t.value = resolved;
  }
}

// 既存の Variables を取得して名前で索引
const existing = await figma("GET", `/files/${FIGMA_FILE_KEY}/variables/local`);
const collectionsByName = new Map(
  Object.values(existing.meta.variableCollections).map((c) => [c.name, c])
);
const variablesByKey = new Map(
  Object.values(existing.meta.variables).map((v) => [`${v.variableCollectionId}:${v.name}`, v])
);

const payload = { variableCollections: [], variableModeValues: [], variables: [] };
let tempId = 0;

function planCollection(name, hidden) {
  const found = collectionsByName.get(name);
  if (found) return { id: found.id, modeId: found.defaultModeId };
  const id = `temp_col_${tempId++}`;
  payload.variableCollections.push({
    action: "CREATE",
    id,
    name,
    hiddenFromPublishing: hidden,
    initialModeId: `temp_mode_${id}`,
  });
  return { id, modeId: `temp_mode_${id}`, created: true };
}

function planVariables(tokens, collection, primitiveVarIds) {
  const ids = new Map();
  for (const t of tokens) {
    const name = t.path.join("/");
    const found = variablesByKey.get(`${collection.id}:${name}`);
    let varId = found?.id;
    if (!found) {
      varId = `temp_var_${tempId++}`;
      payload.variables.push({
        action: "CREATE",
        id: varId,
        name,
        variableCollectionId: collection.id,
        resolvedType: "COLOR",
        description: t.description,
      });
    }
    // セマンティックはプリミティブ変数への alias、プリミティブは実値
    const aliasTarget = t.aliasOf && primitiveVarIds?.get(t.aliasOf);
    payload.variableModeValues.push({
      variableId: varId,
      modeId: collection.modeId,
      value: aliasTarget ? { type: "VARIABLE_ALIAS", id: aliasTarget } : hexToRgba(t.value),
    });
    ids.set(`{color.${t.path.slice(1).join(".")}}`, varId);
  }
  return ids;
}

const primCol = planCollection("Primitives", true);
const semCol = planCollection("Semantic", false);
const primitiveVarIds = planVariables(primitives, primCol);
planVariables(semantics, semCol, primitiveVarIds);

// 既存コレクションのモード名を Light に揃える（新規作成時のみ）
for (const col of payload.variableCollections) {
  payload.variableModeValues
    .filter((m) => m.modeId === `temp_mode_${col.id}`)
    .forEach(() => {});
}

const result = await figma("POST", `/files/${FIGMA_FILE_KEY}/variables`, payload);
console.log(
  `同期完了: collections=${payload.variableCollections.length} created, ` +
    `variables=${payload.variables.length} created, ` +
    `values=${payload.variableModeValues.length} set`
);
if (result.meta) console.log(JSON.stringify(result.meta).slice(0, 300));

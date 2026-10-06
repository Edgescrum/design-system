/**
 * トークン JSON → Figma Variables 一方向同期（コードが正・Figma は写し）。
 *
 * 対応関係:
 *   tokens/color.primitives.json  → コレクション "Primitives"（hiddenFromPublishing）
 *   tokens/color.semantic.json    → コレクション "Semantic"（publish 対象・既定モード "Base"）
 *   modes/<名>.json（tokens/ の外） → コレクション "Semantic" のモード "<名>"（差分のみ）
 *   変数名はトークンパスから機械導出（color.salmon.500 → color/salmon/500、
 *   セマンティックは background → color/background）。手で命名しないこと。
 *
 * 必要な環境変数:
 *   FIGMA_TOKEN     — Personal Access Token（scope: file_variables:read, file_variables:write。
 *                     Variables の書き込みは Figma Enterprise プランでのみ許可される）
 *   FIGMA_FILE_KEY  — ライブラリファイル「Edgescrum DS」のファイルキー
 *                     （**ファイル名を変えてもキーは変わらない**）
 *
 * 冪等: 既存の同名コレクション・変数・モードは値の更新のみ行い、無ければ作成する。
 * Figma 側にしか無い変数は削除しない（写し以外のものを壊さないため）。削除が必要に
 * なったら --prune を実装すること。
 *
 * ★ **payload の組み立ては `figma-payload.mjs`（純関数）にある。** ここは IO だけ。
 *   混ざっていたときに「モード名を設定するコードが空のループだった」のを
 *   ネットワーク無しでは検証できず見逃していた（同ファイル冒頭に経緯）。
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_MODE, loadModes } from "../modes.mjs";
import { buildFigmaPayload } from "./figma-payload.mjs";

const TOKEN_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "tokens");
const API = "https://api.figma.com/v1";

const { FIGMA_TOKEN, FIGMA_FILE_KEY } = process.env;
if (!FIGMA_TOKEN || !FIGMA_FILE_KEY) {
  console.error("FIGMA_TOKEN / FIGMA_FILE_KEY が未設定です。同期をスキップします。");
  process.exit(process.env.CI ? 0 : 1);
}

async function figma(method, url, body) {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: { "X-Figma-Token": FIGMA_TOKEN, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(
      `Figma API ${method} ${url} failed (${res.status}): ${JSON.stringify(json).slice(0, 500)}`
    );
  }
  return json;
}

const readJson = async (name) => JSON.parse(await readFile(join(TOKEN_DIR, name), "utf8"));

const existing = await figma("GET", `/files/${FIGMA_FILE_KEY}/variables/local`);

const { payload, stats } = buildFigmaPayload({
  primitivesJson: await readJson("color.primitives.json"),
  semanticJson: await readJson("color.semantic.json"),
  dimensionJson: await readJson("dimension.json"),
  modes: await loadModes(),
  defaultModeName: DEFAULT_MODE,
  existing: existing.meta,
});

const result = await figma("POST", `/files/${FIGMA_FILE_KEY}/variables`, payload);
console.log(
  `同期完了: collections=${stats.collectionsCreated} created, ` +
    `modes=${stats.modesPlanned} planned, ` +
    `variables=${stats.variablesCreated} created, ` +
    `values=${stats.valuesSet} set` +
    (stats.modeNames.length ? ` (semantic modes: ${stats.modeNames.join(", ")})` : "")
);
if (result.meta) console.log(JSON.stringify(result.meta).slice(0, 300));

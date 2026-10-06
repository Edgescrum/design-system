/**
 * 層の機械検査（ADR 0026 §9-3 / §9-8・作業 5）。
 *
 * ## なぜ標本（fixture）で ESLint を呼ぶのか
 *
 * `_admin/` `_consumer/` `_marketing/` は**まだ空**（最初のシェルは作業 6）。
 * 境界の lint を先に入れてあるが、**守らせる対象が 1 つも無いので規則は 1 度も
 * 実行されない。** 実行されない経路は黙って壊れる —— 作業 3 で「Figma の既定モード名を
 * `Base` に揃えるコード」が**空のループ**のまま誰にも気づかれなかったのと同型。
 *
 * そこで ESLint を API から呼び、**存在しないパスの標本コード**を食わせて
 * 「core → local が error になる」「local:admin → local:consumer が error になる」
 * 「local:admin → core は通る」を毎回実測する。`eslint.config.mjs` の `files:` の
 * 綴りを間違えたら（= 規則がどのファイルにも当たらなくなったら）ここで落ちる。
 *
 * ## 層のラベルは場所から導く
 *
 * `@layer core` のような注釈は書き忘れても何も起きないので腐る。
 * `layers.mjs` の `classifySrcFile()` が唯一の判定器で、**どの規則にも当たらない
 * 置き場所はエラー**にする（分類し忘れを黙って core として扱わない）。
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { AUDIENCES, classifySrcFile, localDir } from "../../layers.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const SRC = join(HERE, "src");

let failed = 0;
function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`  PASS  ${name}`))
    .catch((err) => {
      failed++;
      console.log(`  FAIL  ${name}\n        ${err.message.split("\n").join("\n        ")}`);
    });
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** src 配下の .ts/.tsx を再帰で集める（README.md 等は対象外）。 */
async function sourceFiles(dir = SRC) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await sourceFiles(full)));
    else if (/\.tsx?$/.test(entry.name)) out.push(relative(SRC, full));
  }
  return out.sort();
}

const eslint = new ESLint({ cwd: REPO });

/** 標本コードを「そのパスにあるつもり」で lint して、`no-restricted-imports` の件数を返す。 */
async function lintAs(relFromRepo, code) {
  const [result] = await eslint.lintText(code, { filePath: join(REPO, relFromRepo) });
  assert(
    result && !result.messages.some((m) => m.fatal),
    `標本が parse できない: ${relFromRepo}\n${JSON.stringify(result?.messages)}`
  );
  return result.messages.filter((m) => m.ruleId === "no-restricted-imports");
}

console.log("layers (ADR 0026 §9-3 / §9-8)");

// ── 1. 置き場所とラベル ─────────────────────────────────────────────────────
await check("verify:layer-label — src の全ファイルが層に分類できる", async () => {
  const files = await sourceFiles();
  assert(files.length >= 20, `src のファイルが少なすぎる（${files.length} 件）。走査が空振りしている`);
  const unknown = files.filter((f) => classifySrcFile(f) === null);
  assert(
    unknown.length === 0,
    `どの層にも属さない置き場所がある:\n  ${unknown.join("\n  ")}\n` +
      `src 直下（= core）か ${AUDIENCES.map(localDir).join(" / ")} のいずれかに置くこと`
  );
});

await check("verify:layer-label — オーディエンスとディレクトリが 1:1", async () => {
  const dirs = (await readdir(SRC, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && e.name.startsWith("_"))
    .map((e) => e.name);
  for (const a of AUDIENCES) {
    assert(dirs.includes(localDir(a)), `AUDIENCES の "${a}" に対応する ${localDir(a)}/ が無い`);
  }
  for (const d of dirs) {
    assert(
      AUDIENCES.some((a) => localDir(a) === d),
      `${d}/ は AUDIENCES に無い。**層を足して lint を足し忘れた状態**になっている` +
        `（layers.mjs の AUDIENCES に追加すること。eslint も verify も同じ 1 つを読む）`
    );
  }
});

await check("verify:layer-label — index.ts が export するのは core 層だけ", async () => {
  const index = await readFile(join(SRC, "index.ts"), "utf8");
  const specs = [...index.matchAll(/from\s+"\.\/([^"]+)"/g)].map((m) => m[1]);
  assert(specs.length >= 15, `index.ts の import 元が少なすぎる（${specs.length} 件）`);
  for (const spec of specs) {
    const layer = classifySrcFile(`${spec}.ts`);
    assert(
      layer === "core",
      `index.ts が ${spec} を export している（層: ${layer ?? "不明"}）。` +
        `local 層は専用のエントリポイントから出す（作業 6）`
    );
  }
});

// ── 2. 境界の lint が実際に発火すること（標本・まだ住人が居ないため） ────────────
const CORE_FILE = "packages/ui/src/__fixture__.tsx";
const ADMIN_FILE = `packages/ui/src/${localDir("admin")}/__fixture__.tsx`;

await check("verify:boundary — core → local は拒否される", async () => {
  const msgs = await lintAs(CORE_FILE, `import { X } from "./${localDir("admin")}/AdminShell";\n`);
  assert(msgs.length === 1, `件数が 1 ではない: ${msgs.length}`);
  assert(/core 層は local:admin/.test(msgs[0].message), `文面が違う: ${msgs[0].message}`);
});

await check("verify:boundary — core → local（ディレクトリ直指し）も拒否される", async () => {
  const msgs = await lintAs(CORE_FILE, `import { X } from "./${localDir("consumer")}";\n`);
  assert(msgs.length === 1, `件数が 1 ではない: ${msgs.length}`);
});

await check("verify:boundary — local:admin → local:consumer は拒否される", async () => {
  const msgs = await lintAs(ADMIN_FILE, `import { X } from "../${localDir("consumer")}/Y";\n`);
  assert(msgs.length === 1, `件数が 1 ではない: ${msgs.length}`);
  assert(/local:admin は local:consumer/.test(msgs[0].message), `文面が違う: ${msgs[0].message}`);
});

await check("verify:boundary — local:admin → core は**通る**（向きは一方通行で、壁ではない）", async () => {
  const msgs = await lintAs(ADMIN_FILE, `import { Button } from "../Button";\n`);
  assert(msgs.length === 0, `通るべき import が拒否された: ${msgs.map((m) => m.message)}`);
});

await check("verify:boundary — foundation → ds-core は拒否される", async () => {
  const msgs = await lintAs(
    "packages/tokens/__fixture__.mjs",
    `import { Button } from "@edgescrum/ds-core";\n`
  );
  assert(msgs.length === 1, `件数が 1 ではない: ${msgs.length}`);
  assert(/foundation 層は core/.test(msgs[0].message), `文面が違う: ${msgs[0].message}`);
});

await check("verify:boundary — 旧名 @edgescrum/peco-* は DS の中で拒否される", async () => {
  const core = await lintAs(CORE_FILE, `import { Button } from "@edgescrum/peco-ui";\n`);
  assert(core.length === 1, `core で検出されない: ${core.length}`);
  const tokens = await lintAs(
    "packages/tokens/__fixture__.mjs",
    `import x from "@edgescrum/peco-tokens";\n`
  );
  assert(tokens.length === 1, `foundation で検出されない: ${tokens.length}`);
});

// ── 3. いまのツリーが規則を満たしていること ─────────────────────────────────
await check("verify:boundary — リポジトリ全体に違反が 0 件", async () => {
  const results = await eslint.lintFiles(["packages/**/*.{ts,tsx,mjs}", "apps/**/*.{ts,tsx}"]);
  assert(results.length >= 20, `lint 対象が少なすぎる（${results.length} 件）。glob が空振りしている`);
  const problems = results.flatMap((r) =>
    r.messages.map((m) => `${relative(REPO, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`)
  );
  assert(problems.length === 0, `違反あり:\n  ${problems.join("\n  ")}`);
});

console.log(failed === 0 ? "layers: 全検査 PASS" : `layers: ${failed} 件 FAIL`);
process.exit(failed === 0 ? 0 : 1);

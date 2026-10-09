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

// ── 4. ページの骨格（ADR 0027）— 生成物の DOM を直接見る ─────────────────────────
// 見た目の約束（「peco の今日の描画と同じ」「既定の PageTabBar は 1 バイトも変わらない」）は
// 型でも lint でも守られないので、ビルド済みの dist を実際に描画して文字列で比べる。
console.log("page skeleton (ADR 0027)");

let ui = null;
let renderToStaticMarkup = null;
try {
  ui = await import(join(HERE, "dist", "index.js"));
  ({ renderToStaticMarkup } = await import("react-dom/server"));
} catch (err) {
  ui = null;
  console.log(`  (dist の読み込みに失敗: ${err.message})`);
}
const { createElement: h } = await import("react");
const html = (el) => renderToStaticMarkup(el);
const needDist = () => assert(ui, "dist が無い。`pnpm build` を先に実行すること");
const eq = (actual, expected, what) =>
  assert(actual === expected, `${what}\n        期待: ${expected}\n        実際: ${actual}`);

await check("verify:page-tab-bar — 既定（above-body）の DOM は従来と 1 バイトも変わらない", async () => {
  needDist();
  // peco の existing-plan-nav-dom.baseline.json がバイト単位で固定している形
  eq(
    html(h(ui.PageTabBar, null, "X")),
    '<div class="bg-background px-4 pt-6 sm:px-8 sm:pt-8"><div class="border-b border-border"><div class="flex gap-0 overflow-x-auto">X</div></div></div>',
    "PageTabBar（既定）"
  );
});

await check("verify:page-tab-bar — in-body は自分の下の余白を持ち、上・左右は持たない", async () => {
  needDist();
  eq(
    html(h(ui.PageTabBar, { placement: "in-body" }, "X")),
    '<div class="pb-4 sm:pb-6"><div class="border-b border-border"><div class="flex gap-0 overflow-x-auto">X</div></div></div>',
    "PageTabBar（in-body）"
  );
});

await check("verify:page-body — 余白はトークンだけ・data-* は通し className / style は落とす", async () => {
  needDist();
  eq(
    html(h(ui.PageBody, null, "X")),
    '<main class="bg-background px-page-inline py-page-block sm:px-page-inline-sm sm:py-page-block-sm">X</main>',
    "PageBody（既定）"
  );
  const forced = html(
    h(ui.PageBody, { "data-page-full": true, className: "pt-4", style: { paddingTop: 4 } }, "X")
  );
  assert(forced.includes('data-page-full="true"'), `data-* が通らない: ${forced}`);
  assert(!forced.includes("pt-4") && !forced.includes("style="), `余白の逃げ道が開いている: ${forced}`);
  eq(
    html(h(ui.PageBody, { width: "flow", fill: true }, "X")),
    '<main class="bg-background px-page-inline py-page-block sm:px-page-inline-sm sm:py-page-block-sm mx-auto w-full max-w-content-flow-compact sm:max-w-content-flow flex-1">X</main>',
    "PageBody（width=flow / fill）"
  );
});

await check("verify:app-bar — peco の CustomerPageHeader と同じクラス列（左右余白だけトークン）", async () => {
  needDist();
  const out = html(h(ui.AppBar, { title: "予約", back: h("a", { className: ui.APP_BAR_BACK_CLASS }) }));
  eq(
    out,
    '<header class="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">' +
      '<div class="mx-auto flex w-full max-w-content-flow-compact sm:max-w-content-flow items-center gap-3 px-page-inline py-3 sm:px-page-inline-sm">' +
      '<a class="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg"></a>' +
      '<h1 class="min-w-0 flex-1 truncate text-base font-semibold">予約</h1></div></header>',
    "AppBar"
  );
});

await check("verify:app-bar — titleLines 既定（未指定）と 1 は従来と 1 バイトも変わらない", async () => {
  needDist();
  // 上の検査と同じ期待値を、titleLines の追加後も既定経路が通ることとして固定する（peco #2572）
  const expected =
    '<header class="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">' +
    '<div class="mx-auto flex w-full max-w-content-flow-compact sm:max-w-content-flow items-center gap-3 px-page-inline py-3 sm:px-page-inline-sm">' +
    '<h1 class="min-w-0 flex-1 truncate text-base font-semibold">予約</h1></div></header>';
  eq(html(h(ui.AppBar, { title: "予約" })), expected, "AppBar（titleLines 未指定）");
  eq(html(h(ui.AppBar, { title: "予約", titleLines: 1 })), expected, "AppBar（titleLines=1）");
});

await check("verify:app-bar — titleLines=2 は h1 自身が line-clamp-2 + leading-tight（truncate なし・入れ子なし）", async () => {
  needDist();
  const out = html(h(ui.AppBar, { title: "完了メッセージを編集", titleLines: 2 }));
  // peco #948 ② の旧 <h1 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold leading-tight"> と同じクラスの集合
  assert(
    out.includes('<h1 class="min-w-0 flex-1 line-clamp-2 text-base font-semibold leading-tight">完了メッセージを編集</h1>'),
    `2 行の h1 のクラスが違う: ${out}`
  );
  assert(!out.includes("truncate"), `2 行なのに truncate が残っている: ${out}`);
  assert(!out.includes("whitespace-"), `whitespace の打ち消しは要らないはず: ${out}`);
  // h1 の外側（header / 内側の div）は 1 行のときと同じ
  const one = html(h(ui.AppBar, { title: "完了メッセージを編集" }));
  eq(out.replace(/<h1 [^>]*>/, ""), one.replace(/<h1 [^>]*>/, ""), "AppBar（h1 以外の差分）");
});

await check("verify:centered-notice — 自分の <main> を描き、min-h-app を書かない", async () => {
  needDist();
  const out = html(h(ui.CenteredNotice, { title: "完了", description: "本文" }));
  assert(out.startsWith("<main "), `<main> で始まらない: ${out}`);
  assert(!out.includes("min-h-app"), "DS が peco 固有の min-h-app を書いている");
});

console.log(failed === 0 ? "layers: 全検査 PASS" : `layers: ${failed} 件 FAIL`);
process.exit(failed === 0 ? 0 : 1);

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
import { execFileSync } from "node:child_process";
import { AUDIENCES, classifySrcFile, localDir } from "../../layers.mjs";
import {
  checkRefs,
  expectedFrontmatter,
  findContractFiles,
  parseContract,
  splitDesignMd,
} from "../tokens/scripts/design-md.mjs";

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

await check("verify:centered-notice — content 未指定なら出力が変わらない・指定時は description と note の間に描く（#43）", async () => {
  needDist();
  const base = { title: "完了", description: "本文", note: "補足", actions: h("a", null, "戻る") };
  const without = html(h(ui.CenteredNotice, base));
  const withUndef = html(h(ui.CenteredNotice, { ...base, content: undefined }));
  assert(without === withUndef, "content: undefined で出力が変わった");
  const out = html(h(ui.CenteredNotice, { ...base, content: h("section", { id: "slot" }, "比較") }));
  const iDesc = out.indexOf("本文"), iSlot = out.indexOf('id="slot"'), iNote = out.indexOf("補足"), iAct = out.indexOf("戻る");
  assert(iDesc >= 0 && iSlot > iDesc && iNote > iSlot && iAct > iNote, `順序が description → content → note → actions でない: ${out}`);
});

// ── 4a. タブの variant（#60）— 既定（underline）の経路の DOM を動かさない ──────────────
// peco の existing-plan-nav-dom.baseline.json が店舗設定タブ / プレビュー画面の innerHTML を
// バイト単位で固定している。期待値は variant を足す前（main a6d9a06）の dist をサーバー描画した文字列そのもの。
console.log("tabs (#60)");

const TABS_BEFORE = {
  itemActive: "relative flex flex-1 items-center justify-center whitespace-nowrap py-2.5 text-center text-xs font-medium transition-colors sm:text-sm text-foreground",
  itemInactive: "relative flex flex-1 items-center justify-center whitespace-nowrap py-2.5 text-center text-xs font-medium transition-colors sm:text-sm text-muted hover:text-foreground",
  tabBar: "<div class=\"border-b border-border\"><div class=\"flex gap-0 overflow-x-auto\">X</div></div>",
  tabList: "<div class=\"border-b border-border\"><div class=\"flex gap-0\" role=\"tablist\">X</div></div>",
  tabListLabel: "<div class=\"border-b border-border\"><div class=\"flex gap-0\" role=\"tablist\" aria-label=\"店舗設定\">X</div></div>",
  buttonActive: "<button type=\"button\" role=\"tab\" aria-selected=\"true\" aria-current=\"page\" class=\"relative flex flex-1 items-center justify-center whitespace-nowrap py-2.5 text-center text-xs font-medium transition-colors sm:text-sm text-foreground\" data-testid=\"t\"><span>基本</span><span class=\"ml-1.5 text-xs text-muted\">3</span><span class=\"absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent\"></span></button>",
  buttonInactive: "<button type=\"button\" role=\"tab\" aria-selected=\"false\" class=\"relative flex flex-1 items-center justify-center whitespace-nowrap py-2.5 text-center text-xs font-medium transition-colors sm:text-sm text-muted hover:text-foreground\"><span>外観</span><span class=\"ml-1.5 text-xs text-muted/60\">0</span></button>",
  buttonPlain: "<button type=\"button\" role=\"tab\" aria-selected=\"false\" class=\"relative flex flex-1 items-center justify-center whitespace-nowrap py-2.5 text-center text-xs font-medium transition-colors sm:text-sm text-muted hover:text-foreground\"><span>外観</span></button>",
  filter: "<div class=\"border-b border-border\"><div class=\"flex gap-0\" role=\"tablist\"><button type=\"button\" role=\"tab\" aria-selected=\"true\" aria-current=\"page\" class=\"relative flex flex-1 items-center justify-center whitespace-nowrap py-2.5 text-center text-xs font-medium transition-colors sm:text-sm text-foreground\"><span>すべて</span><span class=\"ml-1.5 text-xs text-muted\">2</span><span class=\"absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent\"></span></button><button type=\"button\" role=\"tab\" aria-selected=\"false\" class=\"relative flex flex-1 items-center justify-center whitespace-nowrap py-2.5 text-center text-xs font-medium transition-colors sm:text-sm text-muted hover:text-foreground\"><span>未払い</span></button></div></div>",
};

await check("verify:tabs — 既定（underline）の DOM・クラスは variant 追加前と 1 バイトも変わらない", async () => {
  needDist();
  const noop = () => {};
  const T = TABS_BEFORE;
  // 省略 / 明示の "underline" / underline に segmented 用の props を渡す（無視される）の 3 通りで同じになること
  for (const [extra, what] of [
    [{}, "省略"],
    [{ variant: "underline" }, "variant=underline"],
    [{ variant: "underline", size: "sm", fullWidth: true }, "underline + size / fullWidth（無視される）"],
  ]) {
    eq(ui.tabItemClass(true, extra.variant, extra), T.itemActive, `tabItemClass(true)（${what}）`);
    eq(ui.tabItemClass(false, extra.variant, extra), T.itemInactive, `tabItemClass(false)（${what}）`);
    eq(html(h(ui.TabBar, extra, "X")), T.tabBar, `TabBar（${what}）`);
    eq(html(h(ui.TabList, extra, "X")), T.tabList, `TabList（${what}）`);
    eq(html(h(ui.TabList, { ...extra, label: "店舗設定" }, "X")), T.tabListLabel, `TabList + label（${what}）`);
    const inList = (btn) => html(h(ui.TabList, extra, btn));
    const wrap = (inner) => T.tabList.replace(">X<", `>${inner}<`);
    eq(inList(h(ui.TabButton, { isActive: true, label: "基本", onClick: noop, count: 3, testId: "t" })), wrap(T.buttonActive), `TabButton（選択中・件数・testId / ${what}）`);
    eq(inList(h(ui.TabButton, { isActive: false, label: "外観", onClick: noop, count: 0 })), wrap(T.buttonInactive), `TabButton（未選択・件数 0 / ${what}）`);
    eq(inList(h(ui.TabButton, { isActive: false, label: "外観", onClick: noop })), wrap(T.buttonPlain), `TabButton（件数なし / ${what}）`);
    const tabs = [{ key: "a", label: "すべて", count: 2 }, { key: "b", label: "未払い" }];
    eq(html(h(ui.TabFilter, { ...extra, tabs, activeKey: "a", onChange: noop })), T.filter, `TabFilter（${what}）`);
  }
  // TabList の外で TabButton を描いても（Context の既定値）従来どおり
  eq(html(h(ui.TabButton, { isActive: true, label: "基本", onClick: noop, count: 3, testId: "t" })), T.buttonActive, "TabButton（TabList の外）");
});

await check("verify:tabs — segmented は角丸の枠 + 塗りで、下線を描かず、任意値を書かない", async () => {
  needDist();
  const noop = () => {};
  const out = html(
    h(ui.TabList, { variant: "segmented", label: "立場" },
      h(ui.TabButton, { isActive: true, label: "お客さま", onClick: noop }),
      h(ui.TabButton, { isActive: false, label: "事業主", onClick: noop }))
  );
  assert(/^<div class="inline-flex gap-0\.5 rounded-full bg-card p-1 ring-1 ring-border" role="tablist" aria-label="立場">/.test(out), `枠の形が違う: ${out}`);
  assert(!out.includes("border-b"), `segmented に下線型の枠が残っている: ${out}`);
  assert(!out.includes("absolute bottom-0"), `segmented に下線が描かれている: ${out}`);
  assert((out.match(/role="tab"/g) ?? []).length === 2, `role="tab" が 2 つでない: ${out}`);
  assert(out.includes('aria-selected="true" aria-current="page"') && out.includes("bg-accent text-on-accent"), `選択中の属性・塗りが無い: ${out}`);
  assert(!/\w-\[|\w\[#/.test(out), `任意値（[...]）を書いている: ${out}`);
  const link = html(h(ui.TabBar, { variant: "segmented", fullWidth: true }, "X"));
  eq(link, '<div class="flex w-full gap-0.5 rounded-full bg-card p-1 ring-1 ring-border">X</div>', "TabBar（segmented / fullWidth。role を付けない）");
});

// ── 4b. 重ねる面と結果の箱（#56）— 既存の呼び出しの DOM を動かさない ──────────────────
// peco は Modal を 33 箇所（うち position="bottom" 9 箇所）、Alert を 50 ファイルで使う。
// #56 で Modal を BottomSheet と共有する枠（dialog-frame）に載せ替え、Alert に押せる行を足した。
// 期待値は載せ替え前（main caa1b82）の dist をサーバー描画した文字列そのもの。
console.log("dialogs and alerts (#56)");

await check("verify:modal — 枠の共有後も DOM は従来と 1 バイトも変わらない（center / bottom / labelledby / presentation）", async () => {
  needDist();
  const noop = () => {};
  eq(
    html(h(ui.Modal, { open: true, onClose: noop, ariaLabel: "確認" }, "X")),
    '<div class="fixed inset-0 z-50 flex bg-black/40 p-4 items-center justify-center"><div role="dialog" aria-modal="true" aria-label="確認" tabindex="-1" class="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl outline-none ">X</div></div>',
    "Modal（center）"
  );
  eq(
    html(h(ui.Modal, { open: true, onClose: noop, ariaLabel: "確認", position: "bottom" }, "X")),
    '<div class="fixed inset-0 z-50 flex bg-black/40 p-4 items-center justify-center"><div role="dialog" aria-modal="true" aria-label="確認" tabindex="-1" class="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl outline-none max-h-[90vh] overflow-y-auto overscroll-contain">X</div></div>',
    "Modal（position=bottom は中央のまま）"
  );
  eq(
    html(h(ui.Modal, { open: true, onClose: noop, ariaLabelledBy: "t", maxWidth: "max-w-md", padding: "p-5" }, "X")),
    '<div class="fixed inset-0 z-50 flex bg-black/40 p-4 items-center justify-center"><div role="dialog" aria-modal="true" aria-labelledby="t" tabindex="-1" class="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl outline-none ">X</div></div>',
    "Modal（ariaLabelledBy / maxWidth / padding）"
  );
  eq(
    html(h(ui.Modal, { open: true, onClose: noop, role: "presentation" }, "X")),
    '<div class="fixed inset-0 z-50 flex bg-black/40 p-4 items-center justify-center"><div role="presentation" class="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl outline-none ">X</div></div>',
    "Modal（role=presentation）"
  );
  eq(html(h(ui.Modal, { open: false, onClose: noop, ariaLabel: "確認" }, "X")), "", "Modal（閉じている）");
});

await check("verify:alert — href / onClick を渡さない Alert の DOM は従来と 1 バイトも変わらない", async () => {
  needDist();
  eq(
    html(h(ui.Alert, { type: "error" }, "登録に失敗しました")),
    '<div role="alert" class="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-600">登録に失敗しました</div>',
    "Alert（error）"
  );
  eq(
    html(h(ui.Alert, { type: "success", "data-testid": "r" }, "保存しました")),
    '<div role="status" class="rounded-xl px-4 py-3 text-sm bg-green-50 text-green-600" data-testid="r">保存しました</div>',
    "Alert（success + data-testid）"
  );
  eq(
    html(h(ui.Alert, { type: "warning" }, "この操作は取り消せません")),
    '<div role="status" class="rounded-xl px-4 py-3 text-sm bg-warning-bg text-warning">この操作は取り消せません</div>',
    "Alert（warning）"
  );
});

await check("verify:alert — 押せる行は live region の箱 1 つの中にリンク 1 つ（role はリンクに付けない）", async () => {
  needDist();
  const out = html(h(ui.Alert, { type: "warning", href: "/d" }, "重複の可能性があるお客さまが 3 組います"));
  assert(/^<div role="status" class="rounded-xl text-sm bg-warning-bg text-warning"><a href="\/d" class="[^"]*">/.test(out), `箱とリンクの形が違う: ${out}`);
  assert((out.match(/role="/g) ?? []).length === 1, `role が 2 つ以上ある（live region の入れ子・リンクの role 上書き）: ${out}`);
  assert(out.includes('aria-hidden="true"'), `› が読み上げから外れていない: ${out}`);
});

await check("verify:bottom-sheet — サーバー描画で落ちず、下に隠れた状態（closed）で出る", async () => {
  needDist();
  const out = html(h(ui.BottomSheet, { open: true, onClose: () => {}, title: "2 組をまとめます" }, h("p", null, "本文")));
  assert(out.includes('role="dialog"') && out.includes('aria-modal="true"'), `dialog になっていない: ${out}`);
  assert(/aria-labelledby="([^"]+)"/.test(out), `名前が見出しを指していない: ${out}`);
  const id = /aria-labelledby="([^"]+)"/.exec(out)[1];
  assert(out.includes(`<h2 id="${id}"`), `aria-labelledby の先の見出しが無い: ${out}`);
  assert(out.includes('data-state="closed"') && !out.includes('data-state="open"'), `サーバーでは入る動きの始点（closed）で描く: ${out}`);
  eq(html(h(ui.BottomSheet, { open: false, onClose: () => {}, title: "x" }, "本文")), "", "BottomSheet（閉じている）");
});

// ── 5. 使い方の約束（ADR-0032 / peco 25_design-system.md §10-3〜§10-5） ─────────────
console.log("usage contracts (ADR-0032 / §10)");

const DESIGN_MD = join(HERE, "DESIGN.md");
const BASELINE = join(HERE, "design-md-baseline.json");
const BASELINE_REL = relative(REPO, BASELINE);
/** パッケージ索引の never の 1 行目（§10-3 が文言まで指定している） */
const FIRST_NEVER = "部品は `@edgescrum/ds-core` から import する。作り直さない。";

/**
 * index.ts から「部品」を export しているモジュール名を集める。
 * 部品 = 値（型ではない）として PascalCase の名前を 1 つ以上 export しているモジュール。
 * `cx` / `useIsDesktop` / `CONTENT_WIDTH_CLASS` だけのモジュールは部品ではない。
 */
async function componentModules() {
  const index = await readFile(join(SRC, "index.ts"), "utf8");
  const mods = new Set();
  for (const m of index.matchAll(/export\s+(type\s+)?\{([^}]*)\}\s+from\s+"\.\/([^"]+)"/g)) {
    if (m[1]) continue; // export type { … }
    const names = m[2]
      .replace(/\/\/.*$/gm, "")
      .split(",")
      .map((x) => x.trim().split(/\s+as\s+/).pop())
      .filter(Boolean);
    if (names.some((n) => /^[A-Z][a-z0-9]+[A-Za-z0-9]*$/.test(n) && /[a-z]/.test(n))) mods.add(m[3]);
  }
  return [...mods].sort();
}

/**
 * 約束の欠落（missing）と baseline を突き合わせる純関数。verify と標本の両方が使う。
 * @returns {string[]} 問題の一覧
 */
function ratchetProblems({ modules, contracts, baseline }) {
  const problems = [];
  const missing = modules.filter((m) => !contracts.has(m));
  for (const m of missing) {
    if (!baseline.includes(m)) {
      problems.push(`${m}: 約束（src/${m}.design.md）が無い。新しく export する部品は約束とセットで入れる（§10-5）`);
    }
  }
  for (const m of baseline) {
    if (!modules.includes(m)) problems.push(`${m}: baseline にあるが export されている部品ではない（baseline から消す）`);
    else if (contracts.has(m)) problems.push(`${m}: 約束を書いたので baseline から消す（ラチェットは減ることしか許さない）`);
  }
  return problems;
}

const designMdText = await readFile(DESIGN_MD, "utf8").catch(() => null);
const contractFiles = await findContractFiles(SRC);
const contractNames = new Set(contractFiles.map((f) => relative(SRC, f).replace(/\.design\.md$/, "")));
const baseline = JSON.parse(await readFile(BASELINE, "utf8")).missing;

await check("verify:design-md-frontmatter — 先頭 YAML が生成結果と一致する（手で触らない）", async () => {
  assert(designMdText, "packages/ui/DESIGN.md が無い");
  const { frontmatter } = splitDesignMd(designMdText);
  const expected = await expectedFrontmatter(HERE);
  assert(frontmatter === expected, `先頭 YAML が生成結果と違う。手で直さず \`pnpm build\` する\n期待:\n${expected}\n実際:\n${frontmatter}`);
});

await check("verify:design-md-never — パッケージ全体の never の 1 行目が §10-3 の文言", async () => {
  assert(designMdText, "packages/ui/DESIGN.md が無い");
  const body = splitDesignMd(designMdText).body;
  const m = /^## Never[^\n]*\n+- (.+)$/m.exec(body);
  assert(m, "本文に「## Never」とその下の箇条が無い");
  assert(m[1].trim() === FIRST_NEVER, `never の 1 行目が違う\n        期待: ${FIRST_NEVER}\n        実際: ${m[1]}`);
  const firstH2 = /^## .*/m.exec(body)?.[0] ?? "";
  assert(firstH2.startsWith("## Never"), `最初の節が Never ではない: ${firstH2}`);
});

await check("verify:design-md-refs — `@path` の参照先がすべて存在し、*.design.md が全部辿れる", async () => {
  const { refs, problems, reached } = await checkRefs(DESIGN_MD);
  assert(problems.length === 0, problems.join("\n"));
  assert(refs.length >= 2, `参照が少なすぎる（${refs.length} 件）。走査が空振りしている`);
  const orphans = contractFiles.filter((f) => !reached.has(f)).map((f) => relative(HERE, f));
  assert(orphans.length === 0, `DESIGN.md から @path で参照されていない約束:\n  ${orphans.join("\n  ")}`);
});

await check("verify:design-contract — *.design.md が §10-2 の必須欄を満たす", async () => {
  assert(contractFiles.length >= 1, "*.design.md が 1 件も無い。走査が空振りしている");
  const problems = [];
  for (const file of contractFiles) {
    const { problems: p } = parseContract(await readFile(file, "utf8"));
    problems.push(...p.map((x) => `${relative(HERE, file)}: ${x}`));
  }
  assert(problems.length === 0, problems.join("\n"));
});

await check("verify:design-contract — 検査器が違反を拒否する（標本: Toggle の約束を壊す）", async () => {
  const toggle = await readFile(join(SRC, "Toggle.design.md"), "utf8");
  assert(parseContract(toggle).problems.length === 0, "標本の元（Toggle.design.md）が通らない");
  const without = (key) => toggle.replace(new RegExp(`^- ${key}:[^\\n]*\\n(\\s{2,}- [^\\n]*\\n)*`, "m"), "");
  const emptied = (key) => toggle.replace(new RegExp(`^(- ${key}:)[^\\n]*\\n(\\s{2,}- [^\\n]*\\n)*`, "m"), "$1\n");
  for (const key of ["purpose", "use_when", "dont_use_when", "never", "check", "decided_by"]) {
    const p = parseContract(without(key)).problems;
    assert(p.some((x) => x.includes(`"${key}" が無い`)), `${key} を消しても通る: ${p}`);
  }
  for (const key of ["dont_use_when", "never"]) {
    const p = parseContract(emptied(key)).problems;
    assert(p.some((x) => x.includes(`"${key}" が空`)), `${key} を空にしても通る: ${p}`);
  }
  const noArrow = toggle.replace(/^(\s{2,}- 操作を実行する（送信・取り消し）)→ Button$/m, "$1");
  assert(noArrow !== toggle, "標本の書き換えが当たっていない（Toggle.design.md の文言が変わった）");
  assert(parseContract(noArrow).problems.some((x) => x.includes("→")), "→ の無い dont_use_when が通る");
});

await check("verify:design-contract-coverage — export される部品はすべて約束を持つ（ラチェット）", async () => {
  const modules = await componentModules();
  assert(modules.length >= 15, `部品のモジュールが少なすぎる（${modules.length} 件）。index.ts の読み取りが空振りしている`);
  assert(modules.includes("Toggle") && modules.includes("icons"), `部品の判定がずれている: ${modules.join(", ")}`);
  const problems = ratchetProblems({ modules, contracts: contractNames, baseline });
  assert(problems.length === 0, problems.join("\n"));
});

await check("verify:design-contract-coverage — 検査器が違反を拒否する（標本）", async () => {
  const modules = ["Toggle", "Button", "NewPart"];
  const contracts = new Set(["Toggle"]);
  // 新しい export に約束が無い → 落ちる
  assert(ratchetProblems({ modules, contracts, baseline: ["Button"] }).some((p) => p.startsWith("NewPart")), "約束の無い新部品が通る");
  // 約束を書いたのに baseline に残す → 落ちる
  assert(ratchetProblems({ modules, contracts, baseline: ["Toggle", "Button", "NewPart"] }).some((p) => p.startsWith("Toggle")), "baseline の消し忘れが通る");
  // 実在しない名前 → 落ちる
  assert(ratchetProblems({ modules, contracts, baseline: ["Button", "NewPart", "Ghost"] }).some((p) => p.startsWith("Ghost")), "架空の baseline が通る");
  assert(ratchetProblems({ modules, contracts, baseline: ["Button", "NewPart"] }).length === 0, "正しい組み合わせが落ちる");
});

/**
 * baseline は**減ることしか許さない**。同じ PR で baseline に名前を足せば上の検査は通ってしまうので、
 * base ブランチ（PR なら GITHUB_BASE_REF、それ以外は main）の baseline と比べる。
 * CI は ci.yml で fetch-depth: 0 にしてある。ローカルで origin/<base> が無いときだけ飛ばす（CI では落とす）。
 */
await check("verify:design-contract-baseline — baseline が base ブランチより増えていない", async () => {
  const base = `origin/${process.env.GITHUB_BASE_REF || "main"}`;
  const git = (...args) => execFileSync("git", args, { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  try {
    git("rev-parse", "--verify", "--quiet", base);
  } catch {
    assert(!process.env.CI, `${base} が無い（CI では fetch-depth: 0 が要る）`);
    console.log(`        (${base} が無いので比較を飛ばした・ローカルのみ)`);
    return;
  }
  let before;
  try {
    before = JSON.parse(git("show", `${base}:${BASELINE_REL}`)).missing;
  } catch {
    console.log(`        (${base} に baseline がまだ無い = 導入 PR。比較は次から効く)`);
    return;
  }
  const added = baseline.filter((m) => !before.includes(m));
  assert(added.length === 0, `baseline に増えた部品がある（${base} と比較）: ${added.join(", ")}\n        約束を書いて export すること`);
});

console.log(failed === 0 ? "layers: 全検査 PASS" : `layers: ${failed} 件 FAIL`);
process.exit(failed === 0 ? 0 : 1);

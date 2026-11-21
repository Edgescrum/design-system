/**
 * packages/ui/DESIGN.md の先頭 YAML を書き込む（本文は手書きが正なので触らない）。
 * 生成規則は foundation の `scripts/design-md.mjs` が唯一の正（core → foundation の向きは許可）。
 *
 * ★ CI では書き込まない。書き込むと手で触った YAML を build が上書きしてから verify が比べるので、
 *   `verify:design-md-frontmatter` が必ず緑になる。
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { syncDesignMd } from "../../tokens/scripts/design-md.mjs";

const PKG_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
await syncDesignMd({ pkgDir: PKG_DIR, write: !process.env.CI });

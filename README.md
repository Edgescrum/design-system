# PeCo Design System

[PeCo（people-connect）](https://people-connect.app) のデザインシステム。
**Git 管理のデザイントークン（W3C DTCG 形式 JSON）を唯一の正**とし、コード（CSS / Tailwind）と
Figma Variables の両方へ一方向に配信する。

要件定義・裁定の経緯は peco 本体の `docs/v2/requirements/25_design-system.md` を参照。

```
tokens/*.json (DTCG) ← 唯一の正
    │  Style Dictionary
    ├→ dist/css/tokens.css      (:root セマンティック変数)
    ├→ dist/css/primitives.css  (:root プリミティブ変数・参照用)
    ├→ dist/css/theme.css       (Tailwind v4 @theme inline)
    │
    └→ CI (figma-sync.yml) ─ Variables REST API → Figma Variables
         Primitives コレクション（hidden）/ Semantic コレクション（publish・Light モード）
```

## パッケージ

| パッケージ | 内容 |
|---|---|
| [`@edgescrum/peco-tokens`](packages/tokens) | デザイントークン（DTCG JSON + 生成 CSS） |
| [`@edgescrum/peco-ui`](packages/ui) | React コンポーネント（Tailwind CSS v4） |

## 開発

```bash
pnpm install
pnpm build        # 全パッケージのビルド（tokens → Style Dictionary / ui → tsup）
pnpm typecheck
```

## トークンの変更フロー

1. `packages/tokens/tokens/*.json` を編集（**生成物 `dist/` は編集しない**）
2. `pnpm changeset` で変更内容と semver を申告
3. PR → CI（build / typecheck / 生成 CSS の検証）→ main にマージ
4. マージで自動実行:
   - `figma-sync.yml` が Figma Variables を更新（コードが正 → Figma は写し）
   - `release.yml` が Version PR を作成 → それをマージすると npm へ publish
5. peco 本体には Renovate が更新 PR を起票 → 通常の PR① フロー（Evaluator 検証）で取り込み

## 消費側（peco 本体）の設定

```css
/* globals.css */
@import "@edgescrum/peco-tokens/css";     /* :root セマンティック変数 */
@import "@edgescrum/peco-tokens/theme.css"; /* @theme inline */
@source "../node_modules/@edgescrum/peco-ui"; /* Tailwind v4 のクラス走査対象に追加 */
```

## Figma 同期のセットアップ（リポジトリ管理者向け）

| 設定 | 場所 | 値 |
|---|---|---|
| `FIGMA_TOKEN` | Actions secret | Personal Access Token（scope: `file_variables:read/write`。Variables 書き込みは Figma **Enterprise** プランが必要） |
| `FIGMA_FILE_KEY` | Actions variable | ライブラリファイル「PeCo Design System」のファイルキー |
| `NPM_TOKEN` | Actions secret | npm publish 用（未設定の間は publish をスキップし Version PR のみ） |

## ライセンス

コードは [MIT](LICENSE)。ただし **PeCo のロゴ・ブランドカラー・アイコン等のブランドアセットは
Edgescrum Inc. の商標的資産であり、MIT ライセンスの対象外**（PeCo / Edgescrum を名乗る用途での
再利用は不可）。

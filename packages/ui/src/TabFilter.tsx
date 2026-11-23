"use client";

/**
 * `{ key, label, count }` の配列からタブバーを描く薄いラッパ。
 * 分析 (`analytics-client.tsx`) と口コミ管理 (`review-management-client.tsx`) が使う。
 *
 * #893: それまで独自のピル型 (`bg-gray-100` + 白い選択肢) で、店舗設定 /
 *   メニュー / プレビューの下線タブと見た目が食い違っていた。
 *   見た目とマークアップは `./Tabs` に一本化し、このファイルは
 *   「配列から描く」だけの責務に絞る。
 */

import { TabList, TabButton, type TabSize, type TabVariant } from "./Tabs";

interface TabItem<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface TabFilterProps<T extends string> {
  tabs: TabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  /**
   * 見た目。既定 `"underline"`（従来どおり）。そのまま `TabList` に渡す（#60）。
   * **中身を切り替える絞り込みは下線型のまま**（#893 でピル型を外した経緯）。
   * `"segmented"` は同じ中身の見方・立場を 2〜3 択で切り替えるときだけ（`Tabs.design.md`）
   */
  variant?: TabVariant;
  /** `"segmented"` のときだけ効く */
  size?: TabSize;
  /** `"segmented"` のときだけ効く */
  fullWidth?: boolean;
}

export function TabFilter<T extends string>({
  tabs,
  activeKey,
  onChange,
  variant,
  size,
  fullWidth,
}: TabFilterProps<T>) {
  return (
    <TabList variant={variant} size={size} fullWidth={fullWidth}>
      {tabs.map((tab) => (
        <TabButton
          key={tab.key}
          isActive={activeKey === tab.key}
          label={tab.label}
          count={tab.count}
          onClick={() => onChange(tab.key)}
        />
      ))}
    </TabList>
  );
}

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

import { TabList, TabButton } from "./Tabs";

interface TabItem<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface TabFilterProps<T extends string> {
  tabs: TabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
}

export function TabFilter<T extends string>({ tabs, activeKey, onChange }: TabFilterProps<T>) {
  return (
    <TabList>
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

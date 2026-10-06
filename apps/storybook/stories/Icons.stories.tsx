import type { ComponentType, SVGProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CloseIcon,
  EmailIcon,
  ExternalLinkIcon,
  EyeIcon,
  GearIcon,
  HeartIcon,
  LineIcon,
  LinkIcon,
  MenuListIcon,
  MessageIcon,
  PhoneIcon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
  SparklesIcon,
  TrashIcon,
  UserIcon,
} from "@edgescrum/peco-ui";

const ICONS: Array<[string, ComponentType<SVGProps<SVGSVGElement>>]> = [
  ["LineIcon", LineIcon],
  ["CheckIcon", CheckIcon],
  ["ChevronRightIcon", ChevronRightIcon],
  ["ChevronLeftIcon", ChevronLeftIcon],
  ["SearchIcon", SearchIcon],
  ["CalendarIcon", CalendarIcon],
  ["ReceiptIcon", ReceiptIcon],
  ["GearIcon", GearIcon],
  ["UserIcon", UserIcon],
  ["PhoneIcon", PhoneIcon],
  ["EmailIcon", EmailIcon],
  ["CloseIcon", CloseIcon],
  ["HeartIcon", HeartIcon],
  ["MenuListIcon", MenuListIcon],
  ["MessageIcon", MessageIcon],
  ["ClipboardIcon", ClipboardIcon],
  ["ArrowLeftIcon", ArrowLeftIcon],
  ["EyeIcon", EyeIcon],
  ["PlusIcon", PlusIcon],
  ["TrashIcon", TrashIcon],
  ["LinkIcon", LinkIcon],
  ["SparklesIcon", SparklesIcon],
  ["ExternalLinkIcon", ExternalLinkIcon],
];

const meta: Meta = {
  title: "Components/Icons",
};

export default meta;
type Story = StoryObj;

/**
 * 全アイコンの一覧。API は全て `SVGProps<SVGSVGElement>` ベースで、
 * `width` / `height` の既定値が peco 本体での既定サイズを保持している。
 */
export const Gallery: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-4 gap-4 sm:grid-cols-6">
        {ICONS.map(([name, Icon]) => (
          <div
            key={name}
            className="flex flex-col items-center gap-2 rounded-xl bg-card p-4"
          >
            <span className="flex h-8 items-center justify-center text-foreground">
              <Icon />
            </span>
            <code className="text-center text-3xs text-muted">{name}</code>
          </div>
        ))}
        {/*
          ★ ブランドマーク（旧 `PecoLogo`）はここに**無い**（ADR 0026 / 2026-10-06）。
            共通層にプロダクト #1 のロゴが入っていた状態を解消し、product 層へ戻した。
            ロゴが必要な共通部品は slot で受け取る（`FullScreenLoading` の `logo`）。
        */}
      </div>
      <div className="flex items-center gap-4">
        <code className="text-xs text-muted">HeartIcon filled</code>
        <HeartIcon className="text-danger" />
        <HeartIcon filled className="text-danger" />
      </div>
      <div className="flex items-center gap-4">
        <code className="text-xs text-muted">サイズは width / height で指定</code>
        <PlusIcon width={16} height={16} />
        <PlusIcon width={24} height={24} />
        <PlusIcon width={32} height={32} />
      </div>
    </div>
  ),
};

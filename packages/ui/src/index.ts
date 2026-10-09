/**
 * @edgescrum/ds-core — Edgescrum デザインシステムの **core 層**。
 *
 * オーディエンス（admin / consumer / marketing）を問わず同じ意味で使える部品だけを置く。
 * 業務概念・情報設計・**ブランドマーク**は product 層（各プロダクトのリポジトリ）の担当。
 * 判定規則は peco の docs/adr/0026-design-system-layers-are-audience-local-systems.md。
 *
 * コア 17 部品（docs/v2/requirements/25_design-system.md §3）はここから export する。
 */
export { cx } from "./cx";
export { Button, buttonClass } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";
export { Badge } from "./Badge";
export type { BadgeProps, BadgeTone, BadgeVariant, BadgeSize } from "./Badge";
export { RatingBadge, ratingToneClass } from "./RatingBadge";
export type { RatingBadgeProps } from "./RatingBadge";
export { Spinner } from "./Spinner";
export { Alert } from "./Alert";
export { PageContainer } from "./PageContainer";
// ページの骨格（ADR 0027）。シェル自体はプロダクトが持ち、DS は部品とトークンだけを持つ
export { PageBody } from "./PageBody";
export type { PageBodyProps, DataAttributes } from "./PageBody";
export { AppBar, APP_BAR_BACK_CLASS } from "./AppBar";
export type { AppBarProps, AppBarTitleLines } from "./AppBar";
export { CenteredNotice } from "./CenteredNotice";
export type { CenteredNoticeProps } from "./CenteredNotice";
export { CONTENT_WIDTH_CLASS } from "./content-width";
export type { ContentWidth } from "./content-width";
export { FormLabel, FormInput, FormTextarea } from "./FormField";
export { StepProgress } from "./StepProgress";
export type { StepProgressProps } from "./StepProgress";
export { Pagination, getPaginationRange, DEFAULT_PAGE_SIZE } from "./Pagination";
export type { PaginationProps, PaginationRange } from "./Pagination";
export { SheetActions, sheetActionsClass, SHEET_ACTIONS_CLASS } from "./SheetActions";
export { Toggle } from "./Toggle";
export { NumberField } from "./NumberField";
export type { NumberFieldProps } from "./NumberField";
export { FullScreenLoading } from "./FullScreenLoading";
export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";
export { useDialogBehavior } from "./dialog-behavior";
export { SelectDropdown } from "./SelectDropdown";
export type { SelectDropdownOption } from "./SelectDropdown";
export { useIsDesktop } from "./use-is-desktop";
export {
  TabBar,
  PageTabBar,
  TabList,
  TabButton,
  TabUnderline,
  tabItemClass,
  TAB_ITEM_BASE_CLASS,
} from "./Tabs";
export { TabFilter } from "./TabFilter";
export {
  LineIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  SearchIcon,
  CalendarIcon,
  ReceiptIcon,
  GearIcon,
  UserIcon,
  PhoneIcon,
  EmailIcon,
  CloseIcon,
  HeartIcon,
  MenuListIcon,
  MessageIcon,
  ClipboardIcon,
  ArrowLeftIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  LinkIcon,
  SparklesIcon,
  ExternalLinkIcon,
  // ★ ブランドマーク（旧 `PecoLogo`）は **export しない**（ADR 0026）。
  //   product 層が持つ。共通部品で必要な場所は slot で受け取る
  //   （`FullScreenLoading` の `logo` が唯一の例）。
} from "./icons";

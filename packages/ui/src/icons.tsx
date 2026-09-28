import type { SVGProps } from "react";

/**
 * 共通アイコンコンポーネント
 * SVGアイコンの重複を排除するために集約
 *
 * ## API（昇格時の統一・docs/audit-2026-09-27.md §6）
 *
 * peco 本体では `{ size?: number; className?: string }` の個別 props と
 * `SVGProps<SVGSVGElement>`（PecoLogo のみ）が混在していた。昇格にあたり
 * **全アイコンを PecoLogo と同じ `SVGProps<SVGSVGElement>` ベースに統一**する。
 *
 * - 旧 `size={n}` は `width` / `height` の**デフォルト値**として残してあるので、
 *   何も渡さなければ従来と同じ大きさで描画される（svg パス・viewBox・
 *   stroke 系属性は 1 文字も変えていない）
 * - サイズを変えるときは `width` / `height`（または className）で指定する
 */

export function LineIcon({ width = 20, height = 20, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

export function CheckIcon({ width = 16, height = 16, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function ChevronRightIcon({ width = 14, height = 14, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function ChevronLeftIcon({ width = 20, height = 20, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function SearchIcon({ width = 16, height = 16, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function CalendarIcon({ width = 18, height = 18, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

/** 請求（Invoice）の導線に使うレシートアイコン。INV-4 (#2274)。 */
export function ReceiptIcon({ width = 18, height = 18, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 2.5 6 4l2-1.5L10 4l2-1.5L14 4l2-1.5L18 4l2-1.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

export function GearIcon({ width = 16, height = 16, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function UserIcon({ width = 18, height = 18, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function PhoneIcon({ width = 18, height = 18, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

export function EmailIcon({ width = 18, height = 18, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function CloseIcon({ width = 12, height = 12, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function HeartIcon({
  width = 16,
  height = 16,
  filled = false,
  ...props
}: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function MenuListIcon({ width = 16, height = 16, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export function MessageIcon({ width = 16, height = 16, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function ClipboardIcon({ width = 16, height = 16, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z" />
      <rect x="4" y="5" width="16" height="17" rx="2" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="13" y2="15" />
    </svg>
  );
}

export function ArrowLeftIcon({ width = 20, height = 20, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export function EyeIcon({ width = 16, height = 16, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function PlusIcon({ width = 16, height = 16, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function TrashIcon({ width = 16, height = 16, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function LinkIcon({ width = 16, height = 16, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function SparklesIcon({ width = 16, height = 16, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3l1.9 4.6L18 9.5l-4.1 1.9L12 16l-1.9-4.6L6 9.5l4.1-1.9L12 3z" />
      <path d="M19 17l.7 1.6L21 19l-1.3.4L19 21l-.7-1.6L17 19l1.3-.4L19 17z" />
    </svg>
  );
}

/**
 * #2093: 「押すと別タブ / 外部ブラウザで開く」ことを示す外部リンクアイコン。
 *
 * 角から矢印が出る定番の形（箱 + 右上への矢印）。**絵文字を使わない**のは
 * 絵文字だとフォント依存で形が変わり、線画のナビ項目の中で浮くため。
 * `aria-hidden` は呼び出し側で付けず**ここで持つ** — このアイコンは
 * 装飾であって、リンクの名前はラベル側のテキストが担う。
 */
export function ExternalLinkIcon({ width = 12, height = 12, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

/**
 * PeCo ロゴの inline SVG コンポーネント。
 *
 * - HTTP リクエストを削減するため、`<img src="/logo.svg">` の代わりに本コンポーネントを使う
 * - ロゴは 2 色（#f08c79 / #be7c7b）で構成されているため、`currentColor` 化はせず元の塗り分けを維持する
 * - 反転（白色化）が必要な場所は従来通り `className="brightness-0 invert"` で対応する
 * - サイズ・色味は className（Tailwind）で制御する。width/height 属性は意図的に持たせていない
 */
export function PecoLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="470 395 1440 565"
      role="img"
      {...props}
    >
      <path
        fill="#f08c79"
        d="M 724.50 772.95 A 0.46 0.45 -3.1 0 0 724.06 773.43 Q 725.56 802.93 727.64 828.81 C 729.73 854.92 731.60 877.99 736.72 901.35 C 738.65 910.16 739.58 919.06 737.62 926.37 C 733.17 943.03 715.91 948.46 700.33 948.15 Q 691.86 947.98 686.59 945.17 Q 675.45 939.23 672.57 926.95 Q 669.29 912.96 666.65 892.34 C 658.39 828.07 654.80 764.31 657.56 699.50 Q 659.99 642.53 666.94 588.23 Q 671.15 555.37 676.50 532.71 Q 679.71 519.07 691.47 512.50 C 703.61 505.72 720.24 502.91 732.62 510.73 C 741.94 516.62 742.76 525.42 741.54 535.51 Q 740.51 544.12 738.50 554.99 Q 736.88 563.79 733.06 590.13 Q 730.58 607.26 728.84 625.42 Q 724.56 670.30 723.33 716.46 A 0.89 0.89 0.0 0 0 724.23 717.37 Q 782.86 716.39 829.53 681.52 C 849.42 666.65 864.25 645.62 874.01 622.75 C 882.28 603.36 883.96 580.90 881.09 559.96 C 878.69 542.43 872.92 527.75 862.83 512.92 Q 848.61 492.01 825.87 480.07 C 812.88 473.24 801.26 469.45 785.60 465.30 C 766.68 460.28 746.92 458.93 728.50 460.30 Q 693.76 462.88 661.63 473.90 Q 650.38 477.76 633.31 485.83 Q 603.86 499.74 580.59 522.45 C 562.11 540.48 549.67 560.40 544.47 584.94 Q 542.09 596.17 543.52 605.97 C 544.81 614.88 549.84 626.01 557.37 631.31 C 566.40 637.66 580.71 637.14 590.38 632.79 C 594.46 630.95 596.64 628.63 600.56 625.85 C 605.54 622.32 613.91 620.80 619.89 623.44 C 633.35 629.38 637.01 641.40 634.63 655.21 Q 633.12 664.03 627.46 670.70 C 618.80 680.92 608.81 688.55 595.83 692.94 Q 574.73 700.08 553.48 695.98 C 528.02 691.06 505.61 674.91 493.74 652.06 Q 485.80 636.80 483.60 618.42 C 479.14 581.18 489.81 543.83 512.47 514.15 Q 524.94 497.82 539.77 484.51 C 561.42 465.08 584.78 448.59 611.12 436.11 Q 625.82 429.15 641.85 423.47 C 663.94 415.65 687.22 411.15 709.97 408.10 Q 757.51 401.73 803.35 410.20 Q 828.66 414.88 848.06 423.04 C 874.74 434.25 897.33 449.20 916.43 470.31 C 932.10 487.62 943.26 509.95 947.90 532.78 Q 954.34 564.44 951.17 591.48 Q 948.87 611.15 944.14 627.84 Q 943.05 631.68 937.69 644.81 C 931.94 658.90 924.96 670.82 916.35 682.12 Q 912.27 687.49 904.42 696.68 Q 895.66 706.92 879.32 720.47 C 872.29 726.29 861.26 733.27 854.99 737.23 C 838.17 747.85 819.65 755.34 799.28 761.80 C 775.09 769.47 750.09 772.33 724.50 772.95 Z"
      />
      <path
        fill="#be7c7b"
        d="M 1811.32 890.71 A 0.31 0.31 0.0 0 1 1811.62 891.25 Q 1799.71 900.55 1786.39 906.90 C 1774.65 912.49 1761.00 917.96 1747.88 920.10 Q 1716.72 925.18 1686.00 919.48 C 1672.68 917.00 1659.52 911.81 1646.56 905.44 Q 1625.58 895.11 1609.17 879.02 C 1603.68 873.64 1600.21 868.92 1595.09 862.43 Q 1588.13 853.62 1582.70 843.25 A 0.51 0.50 -44.8 0 0 1581.81 843.25 C 1576.63 852.61 1569.31 860.09 1562.20 868.04 C 1550.70 880.91 1537.33 890.63 1521.73 899.47 Q 1492.97 915.77 1462.20 921.40 Q 1392.32 934.21 1327.89 905.03 C 1301.76 893.21 1279.23 875.52 1260.03 854.25 C 1252.69 846.12 1248.44 839.41 1241.32 828.81 Q 1236.35 821.41 1232.52 813.64 C 1216.94 782.04 1208.31 747.42 1206.10 712.82 Q 1204.17 682.61 1207.31 656.23 C 1214.56 595.18 1243.55 535.42 1290.39 494.84 Q 1327.77 462.44 1376.91 448.95 C 1398.39 443.06 1420.65 442.35 1442.24 443.41 C 1494.73 445.97 1548.56 475.77 1559.59 531.20 Q 1563.09 548.83 1560.83 569.69 Q 1559.72 579.87 1555.69 589.44 C 1550.59 601.54 1545.06 611.47 1535.78 620.55 Q 1503.17 652.48 1457.22 647.55 Q 1436.15 645.29 1418.72 633.56 C 1399.78 620.82 1388.06 596.82 1398.14 574.81 C 1405.69 558.31 1426.21 555.90 1437.66 569.60 Q 1439.03 571.23 1441.46 575.81 A 8.10 7.89 -80.1 0 0 1442.52 577.36 Q 1446.87 582.35 1449.33 584.68 C 1456.26 591.23 1468.11 592.44 1476.80 590.29 C 1484.19 588.46 1490.52 582.54 1494.63 575.88 Q 1507.23 555.48 1496.98 531.78 Q 1495.63 528.66 1489.75 520.73 C 1479.70 507.15 1460.88 499.59 1444.22 498.07 Q 1426.70 496.47 1412.60 498.64 Q 1403.67 500.01 1392.53 504.07 C 1376.13 510.06 1361.61 517.40 1348.80 528.08 Q 1339.68 535.68 1330.06 546.53 Q 1321.30 556.40 1314.32 567.57 Q 1307.01 579.25 1299.22 596.70 Q 1290.45 616.35 1286.23 637.75 C 1280.78 665.39 1279.01 692.67 1283.13 721.06 C 1284.94 733.51 1287.07 746.39 1290.85 758.11 Q 1299.79 785.81 1317.16 809.37 Q 1320.33 813.66 1329.35 822.96 C 1344.73 838.83 1363.15 849.15 1384.02 856.75 C 1412.52 867.13 1443.18 867.63 1472.35 858.23 Q 1522.05 842.23 1547.89 793.41 Q 1553.90 782.05 1558.53 763.82 C 1560.32 756.82 1561.09 747.93 1562.30 741.27 Q 1565.23 725.10 1572.80 710.83 Q 1585.57 686.78 1610.45 675.71 A 0.42 0.42 0.0 0 0 1610.47 674.95 C 1597.41 668.45 1588.09 657.61 1585.61 642.81 Q 1583.35 629.40 1589.12 616.28 C 1594.14 604.84 1606.20 595.10 1618.27 592.52 Q 1623.05 591.50 1632.18 591.53 C 1644.22 591.57 1654.86 597.64 1663.11 605.97 Q 1670.22 613.14 1672.76 623.79 Q 1677.22 642.49 1667.62 658.46 C 1664.30 663.97 1657.91 669.48 1652.64 673.42 A 0.29 0.29 0.0 0 0 1652.81 673.94 Q 1662.51 674.15 1674.27 673.59 C 1695.25 672.59 1716.97 665.50 1734.09 652.85 Q 1737.13 650.60 1739.73 647.43 A 0.43 0.43 0.0 0 1 1740.46 647.85 Q 1739.65 650.04 1739.57 650.81 C 1738.91 656.70 1738.39 663.62 1735.13 670.64 C 1725.24 691.99 1702.75 704.58 1681.73 715.25 C 1671.11 720.64 1660.57 728.92 1654.56 739.32 Q 1649.04 748.86 1647.35 759.04 C 1645.49 770.22 1645.50 782.75 1647.57 794.70 C 1650.56 811.92 1655.77 828.20 1664.67 842.83 C 1675.80 861.14 1689.66 875.63 1709.12 885.39 C 1722.85 892.28 1738.88 897.18 1754.75 898.83 C 1774.28 900.86 1793.03 897.26 1811.32 890.71 Z"
      />
      <path
        fill="#f08c79"
        d="M 1698.51 865.30 C 1707.58 868.69 1717.65 870.33 1727.72 869.19 Q 1748.77 866.80 1765.88 854.50 Q 1774.21 848.51 1782.23 838.56 C 1793.87 824.13 1802.29 808.42 1806.66 790.45 Q 1811.52 770.43 1812.06 749.25 C 1812.47 733.43 1810.37 719.19 1806.34 704.65 C 1801.71 687.95 1786.95 671.22 1767.82 674.85 C 1758.79 676.56 1753.49 679.75 1742.87 685.29 A 1.21 0.94 7.0 0 0 1742.72 685.38 L 1737.29 689.33 A 0.38 0.38 0.0 0 1 1736.79 688.76 C 1749.18 676.06 1755.32 659.25 1751.49 641.55 A 3.21 3.21 0.0 0 1 1752.33 638.62 Q 1771.68 618.82 1796.73 609.78 A 0.52 0.52 0.0 0 0 1796.80 608.83 C 1778.61 598.88 1770.04 578.69 1774.15 558.66 C 1775.68 551.19 1780.82 541.23 1786.55 535.74 C 1801.85 521.08 1826.11 517.55 1844.35 528.61 C 1863.36 540.13 1871.80 562.94 1863.65 584.00 Q 1857.44 600.05 1842.34 609.08 A 0.52 0.52 0.0 0 0 1842.39 610.00 C 1862.93 619.23 1877.01 636.09 1885.77 656.66 Q 1893.42 674.60 1896.23 696.24 Q 1901.48 736.66 1889.92 776.92 Q 1885.31 792.99 1883.74 796.70 Q 1879.07 807.75 1871.56 822.59 Q 1870.25 825.19 1868.56 827.58 Q 1859.14 840.92 1855.34 845.33 Q 1850.20 851.31 1840.41 860.38 Q 1826.33 873.44 1808.20 880.44 C 1794.85 885.59 1777.96 889.25 1763.29 888.23 Q 1750.79 887.36 1739.25 884.70 C 1725.67 881.58 1710.60 873.38 1698.38 865.57 A 0.15 0.15 0.0 0 1 1698.51 865.30 Z"
      />
      <path
        fill="#be7c7b"
        d="M 1201.40 792.67 Q 1208.14 813.02 1217.69 830.00 A 2.51 2.49 -45.7 0 1 1217.71 832.42 Q 1204.72 856.26 1186.30 875.79 C 1169.02 894.11 1146.06 908.39 1122.17 915.89 C 1091.63 925.48 1058.93 927.35 1028.24 919.21 Q 1012.17 914.95 996.19 906.05 Q 980.37 897.24 969.34 885.79 Q 946.03 861.60 937.11 827.89 C 924.85 781.59 929.53 730.89 952.40 688.63 Q 958.20 677.89 967.73 665.36 C 981.48 647.27 1000.40 631.98 1019.68 622.96 Q 1047.24 610.08 1080.53 609.83 C 1108.11 609.62 1140.50 621.20 1153.95 647.04 C 1166.30 670.76 1164.47 700.34 1153.23 724.09 C 1143.04 745.61 1124.34 764.20 1104.89 777.11 Q 1086.63 789.23 1066.17 797.07 Q 1037.10 808.21 1007.14 812.57 A 0.89 0.89 0.0 0 0 1006.42 813.71 Q 1008.64 821.06 1012.10 828.94 Q 1017.21 840.59 1028.32 851.41 C 1049.58 872.11 1080.86 873.89 1108.66 868.48 C 1136.71 863.02 1161.99 845.41 1179.92 823.44 Q 1191.30 809.51 1200.54 792.59 A 0.47 0.47 0.0 0 1 1201.40 792.67 Z M 1001.86 773.81 C 1029.33 769.36 1054.75 757.47 1074.86 737.86 C 1090.79 722.32 1102.91 698.11 1099.03 675.43 C 1097.94 669.06 1095.47 662.98 1089.51 659.69 Q 1082.68 655.92 1074.72 656.17 Q 1055.66 656.77 1040.85 669.12 Q 1026.27 681.28 1017.92 698.16 Q 1015.08 703.92 1011.17 714.68 Q 1007.20 725.59 1005.65 731.66 Q 1000.46 751.95 1001.11 773.19 A 0.65 0.65 0.0 0 0 1001.86 773.81 Z"
      />
      <path
        fill="#f08c79"
        d="M 1718.52 792.93 A 0.58 0.58 0.0 0 0 1718.61 791.87 C 1697.01 779.90 1699.33 747.32 1723.79 740.18 Q 1733.75 737.27 1743.54 741.05 C 1762.75 748.47 1766.64 773.57 1752.06 787.59 Q 1749.74 789.83 1746.44 792.14 A 0.38 0.38 0.0 0 0 1746.54 792.82 Q 1770.87 800.82 1778.45 825.32 A 2.18 2.15 -36.7 0 1 1778.16 827.21 Q 1765.98 844.62 1747.12 854.12 Q 1736.87 859.29 1725.50 859.17 C 1712.40 859.03 1699.37 855.93 1688.37 848.35 A 3.66 3.65 11.8 0 1 1686.87 846.07 C 1681.98 822.27 1696.00 800.55 1718.52 792.93 Z"
      />
    </svg>
  );
}

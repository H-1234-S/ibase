/** 16px stroke icon set for the org console, colored via currentColor. */

type IconProps = { className?: string };

function svg(
  className: string | undefined,
  children: React.ReactNode,
) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function GridIcon({ className }: IconProps) {
  return svg(
    className,
    <>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </>,
  );
}

export function UsersIcon({ className }: IconProps) {
  return svg(
    className,
    <>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M2.5 13.5c.8-2.3 3-3.5 5.5-3.5s4.7 1.2 5.5 3.5" />
    </>,
  );
}

export function MailIcon({ className }: IconProps) {
  return svg(
    className,
    <>
      <rect x="2" y="3" width="12" height="10" rx="2" />
      <path d="m3.5 5 4.5 3.5L12.5 5" />
    </>,
  );
}

export function SlidersIcon({ className }: IconProps) {
  return svg(
    className,
    <>
      <path d="M2 4.5h7.4M12.6 4.5h1.4" />
      <circle cx="10" cy="4.5" r="1.6" />
      <path d="M2 8h2M7.2 8h6.8" />
      <circle cx="5.6" cy="8" r="1.6" />
      <path d="M2 11.5h7.4M12.6 11.5h1.4" />
      <circle cx="11" cy="11.5" r="1.6" />
    </>,
  );
}

export function DatabaseIcon({ className }: IconProps) {
  return svg(
    className,
    <>
      <ellipse cx="8" cy="3.5" rx="5.5" ry="2" />
      <path d="M2.5 3.5v9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-9" />
      <path d="M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" />
    </>,
  );
}

export function BoxIcon({ className }: IconProps) {
  return svg(
    className,
    <>
      <path d="M8 1.8 13.5 4.5v7L8 14.2 2.5 11.5v-7L8 1.8Z" />
      <path d="M2.5 4.5 8 7.3l5.5-2.8" />
      <path d="M8 7.3v6.9" />
    </>,
  );
}

export function ZapIcon({ className }: IconProps) {
  return svg(
    className,
    <path d="M8.5 1.5 3.5 9h4l-1 5.5L11.5 7h-4l1-5.5Z" />,
  );
}

export function KeyIcon({ className }: IconProps) {
  return svg(
    className,
    <>
      <circle cx="5" cy="8" r="3" />
      <path d="M8 8h5.5M11 8v2.5M13.5 8v1.5" />
    </>,
  );
}

export function ChartIcon({ className }: IconProps) {
  return svg(
    className,
    <path d="M3 13.5V9M6.5 13.5V5M10 13.5V7.5M13.5 13.5V3.5" />,
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return svg(className, <path d="m4 6 4 4 4-4" />);
}

export function ArrowRightIcon({ className }: IconProps) {
  return svg(
    className,
    <path d="M2.5 8h11M9.5 4l4 4-4 4" />,
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return svg(
    className,
    <path d="M13.5 8h-11M6.5 4l-4 4 4 4" />,
  );
}

export function PlusIcon({ className }: IconProps) {
  return svg(className, <path d="M8 3v10M3 8h10" />);
}

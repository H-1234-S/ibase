import type { ReactNode } from 'react';
import type { OrganizationRole } from '@ibase/shared-types';

/** Shared console chrome classes mapped directly from DESIGN.md tokens. */
export const pageContainerClass =
  'mx-auto w-full max-w-[1200px] px-6 py-8 lg:px-10 lg:py-10';

export const cardClass = 'rounded-[12px] border border-[#ebebeb] bg-white';

export const buttonPrimaryClass =
  'flex h-8 items-center gap-1.5 rounded-[6px] bg-[#171717] px-3 text-[14px] font-medium text-white disabled:opacity-50';

export const buttonGhostClass =
  'flex h-8 items-center gap-1.5 rounded-[6px] border border-[#ebebeb] bg-white px-3 text-[14px] font-medium text-[#171717] hover:bg-[#fafafa] disabled:opacity-50';

export const buttonDangerClass =
  'flex h-8 items-center gap-1.5 rounded-[6px] bg-[#ee0000] px-3 text-[14px] font-medium text-white disabled:opacity-50';

export const inputClass =
  'h-8 w-full rounded-[6px] border border-[#ebebeb] bg-white px-2 text-[14px] text-[#171717] outline-none focus:border-[#0070f3]';

export const selectClass =
  'h-8 rounded-[6px] border border-[#ebebeb] bg-white px-2 text-[14px] text-[#171717] outline-none focus:border-[#0070f3]';

/** Maps an organization role to its display label. */
export function roleLabel(role: OrganizationRole) {
  return role === 'admin' ? '管理员' : '成员';
}

/** Small pill badge for an organization role. */
export function RoleBadge({ role }: { role: OrganizationRole }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[12px] leading-4 ${
        role === 'admin'
          ? 'bg-[#f2f2f2] text-[#171717]'
          : 'border border-[#ebebeb] text-[#4d4d4d]'
      }`}
    >
      {roleLabel(role)}
    </span>
  );
}

/** Standard console page header: mono eyebrow, title, and right-side actions. */
export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[12px] font-medium text-[#8f8f8f]">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-[20px] font-semibold leading-7 tracking-[-0.4px] text-[#171717]">
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Inline red error note used for load and form failures. */
export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="text-[12px] leading-4 text-[#ee0000]">
      {message}
    </p>
  );
}

/** Formats an ISO timestamp as a zh-CN date (yyyy/mm/dd). */
export function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

import type { ReactNode } from 'react';

/** Renders the shared eyebrow, title, description, and optional page action. */
export function OrganizationPageHeader({
  eyebrow = '工作区',
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--console-mute)]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-[32px] font-semibold leading-10 tracking-[-1.28px] text-[var(--console-ink)]">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-5 text-[var(--console-body)]">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}

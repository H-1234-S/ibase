'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type {
  OrganizationDetails,
  OrganizationSummary,
} from '@ibase/shared-types';
import { organizationsApi } from '../api/organizations-api';
import {
  ArrowLeftIcon,
  BoxIcon,
  ChartIcon,
  ChevronDownIcon,
  DatabaseIcon,
  FolderIcon,
  GridIcon,
  KeyIcon,
  MailIcon,
  SlidersIcon,
  UsersIcon,
  ZapIcon,
} from './org-console-icons';

const orgNav = [
  { key: '', label: '概览', Icon: GridIcon },
  { key: 'projects', label: '项目', Icon: FolderIcon },
  { key: 'members', label: '成员', Icon: UsersIcon },
  { key: 'invitations', label: '邀请', Icon: MailIcon },
  { key: 'settings', label: '设置', Icon: SlidersIcon },
] as const;

const platformNav = [
  { label: '数据库', Icon: DatabaseIcon },
  { label: '存储', Icon: BoxIcon },
  { label: 'Edge Functions', Icon: ZapIcon },
  { label: 'API 密钥', Icon: KeyIcon },
  { label: '用量与账单', Icon: ChartIcon },
] as const;

const navLinkClass =
  'flex items-center gap-2.5 rounded-full px-3 py-2 text-[14px]';

/** Organization console shell: sidebar nav around each org page. */
export function OrgConsoleShell({
  orgId,
  children,
}: {
  orgId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [org, setOrg] = useState<OrganizationDetails | null>(null);
  const [orgs, setOrgs] = useState<OrganizationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrg(null);
    organizationsApi
      .details(orgId)
      .then(setOrg)
      .catch(() => setError('组织信息加载失败，请刷新重试。'));
    organizationsApi
      .list()
      .then(setOrgs)
      .catch(() => setOrgs([]));
  }, [orgId]);

  // The overview lives at the org root; other keys map to /orgs/:orgId/:key.
  const isActive = (key: string) => {
    const base = `/orgs/${orgId}`;
    if (key === '') {
      return pathname === base;
    }
    return (
      pathname === `${base}/${key}` || pathname.startsWith(`${base}/${key}/`)
    );
  };
  const initial = (org?.name ?? orgId).slice(0, 1).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#fafafa] font-sans text-[#171717]">
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-[#ebebeb] bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center px-4">
          <Link
            href="/dashboard"
            className="text-[16px] font-semibold tracking-[-0.4px] text-[#171717]"
          >
            ibase
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-6">
          <details className="group relative px-1">
            <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-[6px] border border-[#ebebeb] bg-white px-2 text-[14px] font-medium tracking-[-0.28px] text-[#171717] hover:bg-[#fafafa] [&::-webkit-details-marker]:hidden">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-[#171717] font-mono text-[11px] font-medium text-white">
                {initial}
              </span>
              <span className="min-w-0 flex-1 truncate text-left">
                {org?.name ?? orgId}
              </span>
              <ChevronDownIcon className="size-4 shrink-0 text-[#8f8f8f]" />
            </summary>
            <div className="absolute left-1 right-1 top-[calc(100%+8px)] z-10 rounded-[12px] border border-[#ebebeb] bg-white p-2 shadow-[0_2px_2px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.08)]">
              {error && (
                <p className="px-2 py-1.5 text-[12px] leading-4 text-[#ee0000]">
                  {error}
                </p>
              )}
              <ul>
                {orgs.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/orgs/${item.id}`}
                      className={`block truncate rounded-[6px] px-2 py-1.5 text-[14px] ${
                        item.id === orgId
                          ? 'bg-[#f2f2f2] text-[#171717]'
                          : 'text-[#4d4d4d] hover:bg-[#fafafa]'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <section>
            <p className="px-3 pb-2 font-mono text-[12px] font-medium text-[#8f8f8f]">
              组织
            </p>
            <ul className="flex flex-col">
              {orgNav.map(({ key, label, Icon }) => (
                <li key={label}>
                  <Link
                    href={`/orgs/${orgId}/${key}`}
                    className={`${navLinkClass} ${
                      isActive(key)
                        ? 'bg-[#f2f2f2] text-[#171717]'
                        : 'text-[#4d4d4d] hover:bg-[#fafafa]'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="px-3 pb-2 font-mono text-[12px] font-medium text-[#8f8f8f]">
              平台 · 即将推出
            </p>
            <ul className="flex flex-col">
              {platformNav.map(({ label, Icon }) => (
                <li
                  key={label}
                  className={`${navLinkClass} cursor-default text-[#a1a1a1]`}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
          </section>
        </nav>

        <div className="shrink-0 border-t border-[#ebebeb] p-3">
          <Link
            href="/dashboard"
            className={`${navLinkClass} text-[#4d4d4d] hover:bg-[#fafafa]`}
          >
            <ArrowLeftIcon className="size-4 shrink-0" />
            返回工作台
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 overflow-x-auto border-b border-[#ebebeb] bg-white px-4 lg:hidden">
          <Link
            href="/dashboard"
            className="shrink-0 text-[14px] font-semibold tracking-[-0.28px] text-[#171717]"
          >
            ibase
          </Link>
          <nav className="flex items-center gap-1">
            {orgNav.map(({ key, label }) => (
              <Link
                key={label}
                href={`/orgs/${orgId}/${key}`}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[14px] ${
                  isActive(key)
                    ? 'bg-[#f2f2f2] text-[#171717]'
                    : 'text-[#4d4d4d]'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

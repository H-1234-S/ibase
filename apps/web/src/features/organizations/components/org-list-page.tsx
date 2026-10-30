'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { OrganizationSummary } from '@ibase/shared-types';
import { organizationsApi } from '../api/organizations-api';
import { getApiErrorMessage } from '../../auth/api/auth-error-message';
import { AuthStatus } from '../../auth/components/auth-status';
import { PlusIcon } from './org-console-icons';
import {
  ErrorNote,
  PageHeader,
  RoleBadge,
  buttonPrimaryClass,
  cardClass,
  formatDate,
  pageContainerClass,
} from './org-console-ui';

/** Workbench page that lists every organization the user belongs to. */
export function OrgListPage() {
  const [orgs, setOrgs] = useState<OrganizationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    organizationsApi
      .list()
      .then(setOrgs)
      .catch((err) =>
        setError(getApiErrorMessage(err, '组织列表加载失败，请刷新重试。')),
      );
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-[#171717]">
      <header className="sticky top-0 z-10 border-b border-[#ebebeb] bg-[#fafafa]">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6 lg:px-10">
          <Link
            href="/orgs"
            className="text-[16px] font-semibold tracking-[-0.4px] text-[#171717]"
          >
            ibase
          </Link>
          <AuthStatus />
        </div>
      </header>

      <main className={pageContainerClass}>
        <PageHeader
          eyebrow="工作台"
          title="你的组织"
          actions={
            <Link
              href="/onboarding/organization"
              className={buttonPrimaryClass}
            >
              <PlusIcon className="size-4" />
              新建组织
            </Link>
          }
        />

        {error && (
          <div className="mt-6">
            <ErrorNote message={error} />
          </div>
        )}
        {!error && orgs === null && (
          <p className="mt-6 text-[14px] text-[#8f8f8f]">加载中…</p>
        )}

        {orgs && orgs.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {orgs.map((org) => (
              <Link
                key={org.id}
                href={`/orgs/${org.id}`}
                className={`${cardClass} flex flex-col gap-4 p-6 hover:bg-[#fafafa]`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-[#171717] font-mono text-[13px] font-medium text-white">
                    {org.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[-0.28px] text-[#171717]">
                    {org.name}
                  </span>
                  <RoleBadge role={org.currentRole} />
                </div>
                <p className="text-[12px] leading-4 text-[#8f8f8f]">
                  创建于 {formatDate(org.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}

        {orgs && orgs.length === 0 && (
          <div
            className={`${cardClass} mt-6 flex flex-col items-center gap-4 rounded-[12px] border-dashed p-16 text-center`}
          >
            <p className="text-[14px] text-[#4d4d4d]">还没有组织</p>
            <Link
              href="/onboarding/organization"
              className={buttonPrimaryClass}
            >
              <PlusIcon className="size-4" />
              新建组织
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

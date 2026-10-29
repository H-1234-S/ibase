'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OrganizationSummary } from '@ibase/shared-types';
import { Button } from '@ibase/ui/components/ui/button';
import { ApiRequestError } from '../../auth/api/auth-api';
import { organizationsApi } from '../api/organizations-api';

/** Resolves the caller's default organization and routes to its workspace. */
export function DashboardPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    void organizationsApi
      .list()
      .then((organizations: OrganizationSummary[]) => {
        if (!active) return;

        const lastOrganization = window.localStorage.getItem(
          'ibase:last-organization',
        );
        const selectedOrganization =
          organizations.find(({ id }) => id === lastOrganization) ??
          organizations[0];

        if (!selectedOrganization) {
          router.replace('/onboarding/organization');
          return;
        }

        window.localStorage.setItem(
          'ibase:last-organization',
          selectedOrganization.id,
        );
        router.replace(`/orgs/${selectedOrganization.id}/dashboard`);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (
          cause instanceof ApiRequestError &&
          cause.code === 'UNAUTHENTICATED'
        ) {
          router.replace('/login?next=%2Fdashboard');
          return;
        }
        setError('组织列表暂时无法加载，请检查服务状态后重试。');
      });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16 text-[var(--console-ink)]">
      {error ? (
        <>
          <p className="font-mono text-xs uppercase text-[var(--console-mute)]">
            组织工作区
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            暂时无法打开 Dashboard
          </h1>
          <p className="mt-3 text-sm text-[var(--console-body)]">{error}</p>
          <Button
            className="mt-6 w-fit rounded-sm bg-[var(--console-ink)] px-3 text-white"
            onClick={() => window.location.reload()}
            type="button"
          >
            重试
          </Button>
        </>
      ) : (
        <p aria-live="polite" className="text-sm text-[var(--console-body)]">
          正在恢复你的组织工作区…
        </p>
      )}
    </main>
  );
}

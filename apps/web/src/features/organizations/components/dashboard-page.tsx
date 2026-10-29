'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OrganizationSummary } from '@ibase/shared-types';
import { Button } from '@ibase/ui/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@ibase/ui/components/ui/alert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ibase/ui/components/ui/card';
import { Skeleton } from '@ibase/ui/components/ui/skeleton';
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
    <main className="flex min-h-screen items-center justify-center bg-[var(--console-canvas)] px-6 py-16 text-[var(--console-ink)]">
      <Card className="w-full max-w-xl rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
        <CardHeader className="p-6 pb-3 sm:p-8 sm:pb-4">
          <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--console-mute)]">
            组织工作区
          </p>
          <CardTitle className="text-[20px] font-semibold leading-7 tracking-[-0.4px]">
            {error ? '暂时无法打开工作区' : '正在恢复工作区'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6 sm:px-8 sm:pb-8">
          {error ? (
            <>
              <Alert className="border-[var(--console-line)] bg-[var(--console-canvas)] text-[var(--console-ink)]">
                <AlertTitle>组织列表暂不可用</AlertTitle>
                <AlertDescription className="text-[var(--console-body)]">
                  {error}
                </AlertDescription>
              </Alert>
              <Button
                className="col-start-2 mt-1 h-11 w-fit rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
                onClick={() => window.location.reload()}
                type="button"
              >
                重试
              </Button>
            </>
          ) : (
            <div aria-live="polite" aria-busy="true" className="space-y-3">
              <Skeleton className="h-4 w-64 rounded-[6px]" />
              <Skeleton className="h-10 w-full rounded-[6px]" />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

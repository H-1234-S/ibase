'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { OrganizationSummary } from '@ibase/shared-types';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@ibase/ui/components/ui/alert';
import { Badge } from '@ibase/ui/components/ui/badge';
import { Button } from '@ibase/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ibase/ui/components/ui/card';
import { Skeleton } from '@ibase/ui/components/ui/skeleton';
import { ApiRequestError } from '../../auth/api/auth-api';
import { organizationsApi } from '../api/organizations-api';
import { organizationRoutes } from '../routes';
import { OrganizationPageHeader } from './organization-page-header';

/** Lists the organizations available to the signed-in user. */
export function OrganizationListPage() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrganizations(await organizationsApi.list());
    } catch (cause) {
      if (
        cause instanceof ApiRequestError &&
        cause.code === 'UNAUTHENTICATED'
      ) {
        window.location.assign('/login?next=%2Forgs');
        return;
      }
      setError('组织列表暂时无法加载，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  return (
    <main className="min-h-screen bg-[var(--console-canvas)] px-6 py-12 text-[var(--console-ink)] sm:py-16">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          className="inline-flex items-center gap-2 text-xl font-semibold tracking-[-0.4px] text-[var(--console-ink)] no-underline"
          href="/"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-[6px] bg-[var(--console-ink)] text-base text-white"
          >
            i
          </span>
          ibase
        </Link>

        <section className="mt-16">
          <OrganizationPageHeader
            eyebrow="BaaS 工作区"
            title="选择一个组织"
            description="组织用于协作管理 BaaS 项目、成员和访问权限。"
            action={
              <Button
                asChild
                className="h-11 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
              >
                <Link href="/onboarding/organization">创建组织</Link>
              </Button>
            }
          />

          {error ? (
            <Alert className="rounded-[12px] border-[var(--console-line)] bg-white p-6 text-[var(--console-ink)]">
              <AlertTitle>组织列表不可用</AlertTitle>
              <AlertDescription className="text-[var(--console-body)]">
                {error}
              </AlertDescription>
              <Button
                className="col-start-2 mt-4 h-11 w-fit rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
                onClick={() => setReloadKey((key) => key + 1)}
                type="button"
              >
                重试
              </Button>
            </Alert>
          ) : loading ? (
            <div
              aria-live="polite"
              aria-busy="true"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <Skeleton className="h-44 rounded-[12px]" />
              <Skeleton className="h-44 rounded-[12px]" />
              <Skeleton className="h-44 rounded-[12px]" />
            </div>
          ) : organizations.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {organizations.map((organization) => (
                <Link
                  className="group block rounded-[12px] text-[var(--console-ink)] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--console-blue)]"
                  href={organizationRoutes.home(organization.id)}
                  key={organization.id}
                  onClick={() =>
                    window.localStorage.setItem(
                      'ibase:last-organization',
                      organization.id,
                    )
                  }
                >
                  <Card className="h-full rounded-[12px] border-[var(--console-line)] bg-white shadow-none transition-colors group-hover:bg-[var(--console-soft)]">
                    <CardHeader className="flex-row items-start justify-between gap-3 p-6">
                      <span className="grid size-10 shrink-0 place-items-center rounded-[6px] bg-[var(--console-soft)] text-sm font-semibold uppercase text-[var(--console-ink)]">
                        {organization.name.slice(0, 1)}
                      </span>
                      <Badge
                        variant="outline"
                        className="rounded-[6px] border-[var(--console-line)] text-[var(--console-body)]"
                      >
                        {organization.currentRole === 'admin'
                          ? '管理员'
                          : '成员'}
                      </Badge>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <CardTitle className="truncate text-base font-semibold leading-6 text-[var(--console-ink)]">
                        {organization.name}
                      </CardTitle>
                      <p className="mt-2 text-sm leading-5 text-[var(--console-mute)]">
                        创建于{' '}
                        {new Date(organization.createdAt).toLocaleDateString()}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--console-body)]">
                        打开工作区 <span aria-hidden="true">→</span>
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
              <CardContent className="grid min-h-72 place-items-center p-6 text-center">
                <div className="max-w-md">
                  <h2 className="text-[20px] font-semibold leading-7 tracking-[-0.4px]">
                    还没有组织
                  </h2>
                  <p className="mt-2 text-sm leading-5 text-[var(--console-body)]">
                    创建组织后，就可以邀请团队成员并共同管理项目。
                  </p>
                  <Button
                    asChild
                    className="mt-6 h-11 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
                  >
                    <Link href="/onboarding/organization">创建第一个组织</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}

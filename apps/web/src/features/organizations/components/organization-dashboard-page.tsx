'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type {
  OrganizationDetails,
  OrganizationMember,
} from '@ibase/shared-types';
import { Button } from '@ibase/ui/components/ui/button';
import { Badge } from '@ibase/ui/components/ui/badge';
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
import { organizationsApi } from '../api/organizations-api';
import { OrganizationPageHeader } from './organization-page-header';

/** Shows organization metrics, members, and role-appropriate management links. */
export function OrganizationDashboardPage({ orgId }: { orgId: string }) {
  const [organization, setOrganization] = useState<OrganizationDetails | null>(
    null,
  );
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    void Promise.all([
      organizationsApi.details(orgId),
      organizationsApi.members(orgId),
    ])
      .then(([details, organizationMembers]) => {
        if (!active) return;
        setOrganization(details);
        setMembers(organizationMembers);
      })
      .catch(() => {
        if (active) setError('组织概览暂时无法加载。');
      });
    return () => {
      active = false;
    };
  }, [orgId, reloadKey]);

  if (error) {
    return (
      <Alert className="rounded-[12px] border-[var(--console-line)] bg-white p-6 text-[var(--console-ink)]">
        <AlertTitle className="text-[20px] leading-7 tracking-[-0.4px]">
          无法加载组织概览
        </AlertTitle>
        <AlertDescription className="mt-2 text-sm leading-5 text-[var(--console-body)]">
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
    );
  }

  if (!organization) {
    return (
      <div aria-live="polite" aria-busy="true" className="space-y-6">
        <Skeleton className="h-4 w-24 rounded-[6px]" />
        <Skeleton className="h-10 w-64 rounded-[6px]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-[12px]" />
          <Skeleton className="h-32 rounded-[12px]" />
        </div>
      </div>
    );
  }

  const managementLinks = [
    {
      href: `/orgs/${orgId}/members`,
      title: '成员',
      description: '查看团队成员及其组织角色。',
    },
    ...(organization.currentRole === 'admin'
      ? [
          {
            href: `/orgs/${orgId}/invitations`,
            title: '邀请',
            description: '邀请同事加入当前组织。',
          },
          {
            href: `/orgs/${orgId}/settings`,
            title: '设置',
            description: '管理组织的危险操作。',
          },
        ]
      : []),
  ];

  return (
    <div>
      <OrganizationPageHeader
        eyebrow="组织概览"
        title={organization.name}
        description="在这里查看组织成员和管理入口。"
        action={
          organization.currentRole === 'admin' ? (
            <Button
              asChild
              className="h-11 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
            >
              <Link href={`/orgs/${orgId}/invitations`}>邀请成员</Link>
            </Button>
          ) : undefined
        }
      />

      <section aria-label="组织信息" className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-normal leading-5 text-[var(--console-body)]">
              组织成员
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <p className="text-[32px] font-semibold leading-10 tracking-[-1.28px] text-[var(--console-ink)]">
              {organization.memberCount}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-normal leading-5 text-[var(--console-body)]">
              你的角色
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <p className="text-[20px] font-semibold leading-7 tracking-[-0.4px] text-[var(--console-ink)]">
              {organization.currentRole === 'admin' ? '管理员' : '成员'}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <Card className="rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 p-6">
            <CardTitle className="text-[20px] font-semibold leading-7 tracking-[-0.4px]">
              成员
            </CardTitle>
            <Link
              className="text-sm text-[var(--console-body)] underline underline-offset-4"
              href={`/orgs/${orgId}/members`}
            >
              查看全部
            </Link>
          </CardHeader>
          <CardContent className="space-y-0 px-6 pb-2 pt-0">
            {members.slice(0, 5).map((member) => (
              <div
                className="flex min-w-0 items-center justify-between gap-4 border-t border-[var(--console-line)] py-4"
                key={member.membershipId}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--console-ink)]">
                    {member.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-[var(--console-mute)]">
                    {member.email}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-[6px] border-[var(--console-line)] text-[var(--console-body)]"
                >
                  {member.role === 'admin' ? '管理员' : '成员'}
                </Badge>
              </div>
            ))}
            {members.length === 0 && (
              <p className="border-t border-[var(--console-line)] py-4 text-sm text-[var(--console-mute)]">
                组织中还没有成员。
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-[20px] font-semibold leading-7 tracking-[-0.4px] text-[var(--console-ink)]">
            管理组织
          </h2>
          {managementLinks.map((item) => (
            <Link
              className="group block rounded-[12px] border border-[var(--console-line)] bg-white p-6 text-[var(--console-ink)] transition-colors hover:bg-[var(--console-soft)]"
              href={item.href}
              key={item.href}
            >
              <span className="flex items-center justify-between gap-3 font-medium">
                {item.title}
                <span aria-hidden="true" className="text-[var(--console-mute)]">
                  →
                </span>
              </span>
              <span className="mt-2 block text-sm leading-5 text-[var(--console-body)]">
                {item.description}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

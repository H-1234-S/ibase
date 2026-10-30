'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import type {
  OrganizationDetails,
  OrganizationSummary,
} from '@ibase/shared-types';
import { Button } from '@ibase/ui/components/ui/button';
import { Badge } from '@ibase/ui/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@ibase/ui/components/ui/breadcrumb';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@ibase/ui/components/ui/alert';
import { Skeleton } from '@ibase/ui/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ibase/ui/components/ui/select';
import { AuthStatus } from '../../auth/components/auth-status';
import { organizationsApi } from '../api/organizations-api';
import { organizationRoutes } from '../routes';
import styles from './organization-shell.module.css';

const navigation = [
  { label: '主页', path: organizationRoutes.home },
  { label: '项目', path: organizationRoutes.projects },
  { label: '成员', path: organizationRoutes.members },
  { label: '邀请', path: organizationRoutes.invitations, adminOnly: true },
  { label: '设置', path: organizationRoutes.settings, adminOnly: true },
];

/** Loads and displays the server-verified organization context for org routes. */
export function OrganizationShell({
  orgId,
  children,
}: {
  orgId: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [organization, setOrganization] = useState<OrganizationDetails | null>(
    null,
  );
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setOrganization(null);
    setError('');

    void Promise.all([organizationsApi.details(orgId), organizationsApi.list()])
      .then(([details, list]) => {
        if (!active) return;
        setOrganization(details);
        setOrganizations(list);
        window.localStorage.setItem('ibase:last-organization', orgId);
      })
      .catch(() => {
        if (active) setError('无法验证此组织的成员权限。');
      });

    return () => {
      active = false;
    };
  }, [orgId, reloadKey]);

  if (error) {
    return (
      <main className={styles.statePage}>
        <p className={styles.eyebrow}>组织工作区</p>
        <Alert className="mt-3 border-[var(--console-line)] bg-white text-[var(--console-ink)]">
          <AlertTitle>组织不可用</AlertTitle>
          <AlertDescription className="text-[var(--console-body)]">
            {error}
          </AlertDescription>
        </Alert>
        <div className={styles.stateActions}>
          <Button
            className="h-11 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-white hover:bg-[var(--console-body)]"
            onClick={() => setReloadKey((key) => key + 1)}
            type="button"
          >
            重试
          </Button>
          <Link className={styles.textLink} href="/orgs">
            返回组织列表
          </Link>
        </div>
      </main>
    );
  }

  if (!organization) {
    return (
      <main className={styles.statePage} aria-live="polite" aria-busy="true">
        <p className={styles.eyebrow}>组织工作区</p>
        <Skeleton className="mt-4 h-8 w-40 rounded-[6px]" />
        <Skeleton className="mt-3 h-4 w-64 rounded-[6px]" />
      </main>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/orgs">
          <span aria-hidden="true" className={styles.brandMark}>
            i
          </span>
          <span>ibase</span>
        </Link>

        <div className={styles.organizationPicker}>
          <span className={styles.eyebrow}>组织</span>
          <Select
            value={orgId}
            onValueChange={(selectedId) => {
              window.localStorage.setItem(
                'ibase:last-organization',
                selectedId,
              );
              router.push(organizationRoutes.home(selectedId));
            }}
          >
            <SelectTrigger
              aria-label="切换组织"
              className="h-11 w-full rounded-[6px] border-[var(--console-line)] bg-white text-[var(--console-ink)] shadow-none focus-visible:ring-[var(--console-blue)]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge
            variant="outline"
            className="rounded-[6px] border-[var(--console-line)] text-[var(--console-body)]"
          >
            {organization.currentRole === 'admin' ? '管理员' : '成员'}
          </Badge>
        </div>

        <nav className={styles.navigation} aria-label="组织导航">
          <span className={styles.eyebrow}>工作区</span>
          {navigation
            .filter(
              (item) => !item.adminOnly || organization.currentRole === 'admin',
            )
            .map((item) => {
              const href = item.path(orgId);
              const active = pathname === href;
              return (
                <Button
                  asChild
                  className={`${styles.navLink} ${active ? styles.activeNavLink : ''}`}
                  key={href}
                  variant={active ? 'secondary' : 'ghost'}
                >
                  <Link aria-current={active ? 'page' : undefined} href={href}>
                    {item.label}
                  </Link>
                </Button>
              );
            })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Button
            asChild
            className="h-11 rounded-[6px] border-[var(--console-line)] bg-white px-1.5 text-[var(--console-ink)] hover:bg-[var(--console-soft)]"
            variant="outline"
          >
            <Link href="/onboarding/organization">创建组织</Link>
          </Button>
          <div className={styles.account}>
            <AuthStatus />
          </div>
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={organizationRoutes.home(orgId)}>
                    {organization.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {navigation.find((item) => pathname === item.path(orgId))
                    ?.label ?? '主页'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import type {
  OrganizationDetails,
  OrganizationSummary,
} from '@ibase/shared-types';
import { Button } from '@ibase/ui/components/ui/button';
import { AuthStatus } from '../../auth/components/auth-status';
import { organizationsApi } from '../api/organizations-api';
import styles from './organization-shell.module.css';

const navigation = [
  { label: '概览', suffix: 'dashboard' },
  { label: '成员', suffix: 'members' },
  { label: '邀请', suffix: 'invitations', adminOnly: true },
  { label: '设置', suffix: 'settings', adminOnly: true },
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
        <p className={styles.eyebrow}>Organization</p>
        <h1 className={styles.stateTitle}>组织不可用</h1>
        <p className={styles.stateDescription}>{error}</p>
        <div className={styles.stateActions}>
          <Button
            className={styles.primaryButton}
            onClick={() => setReloadKey((key) => key + 1)}
            type="button"
          >
            重试
          </Button>
          <Link className={styles.textLink} href="/dashboard">
            返回组织列表
          </Link>
        </div>
      </main>
    );
  }

  if (!organization) {
    return (
      <main className={styles.statePage} aria-live="polite">
        <p className={styles.eyebrow}>Organization</p>
        <h1 className={styles.stateTitle}>正在加载组织…</h1>
      </main>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/dashboard">
          <span className={styles.brandMark}>i</span>
          <span>ibase</span>
        </Link>

        <div className={styles.organizationPicker}>
          <span className={styles.eyebrow}>组织</span>
          <label className={styles.selectLabel}>
            <span className="sr-only">切换组织</span>
            <select
              className={styles.select}
              value={orgId}
              onChange={(event) => {
                const selectedId = event.target.value;
                window.localStorage.setItem(
                  'ibase:last-organization',
                  selectedId,
                );
                window.location.assign(`/orgs/${selectedId}/dashboard`);
              }}
            >
              {organizations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <span className={styles.roleBadge}>
            {organization.currentRole === 'admin' ? '管理员' : '成员'}
          </span>
        </div>

        <nav className={styles.navigation} aria-label="组织导航">
          <span className={styles.eyebrow}>工作区</span>
          {navigation
            .filter(
              (item) => !item.adminOnly || organization.currentRole === 'admin',
            )
            .map((item) => {
              const href = `/orgs/${orgId}/${item.suffix}`;
              const active = pathname === href;
              return (
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={`${styles.navLink}${active ? ` ${styles.activeNavLink}` : ''}`}
                  href={href}
                  key={item.suffix}
                >
                  <span aria-hidden="true" className={styles.navMark} />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link className={styles.createLink} href="/onboarding/organization">
            + 创建组织
          </Link>
          <div className={styles.account}>
            <AuthStatus />
          </div>
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumbs}>
            <span>{organization.name}</span>
            <span aria-hidden="true">/</span>
            <strong>
              {navigation.find(
                (item) => pathname === `/orgs/${orgId}/${item.suffix}`,
              )?.label ?? '概览'}
            </strong>
          </div>
          <span className={styles.topbarRole}>
            {organization.currentRole === 'admin' ? '管理员' : '成员'}
          </span>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

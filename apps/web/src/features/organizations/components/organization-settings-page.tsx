'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { OrganizationDetails } from '@ibase/shared-types';
import { Button } from '@ibase/ui/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@ibase/ui/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ibase/ui/components/ui/card';
import { Field, FieldLabel } from '@ibase/ui/components/ui/field';
import { Input } from '@ibase/ui/components/ui/input';
import { toast } from '@ibase/ui/components/ui/sonner';
import { organizationsApi } from '../api/organizations-api';
import { OrganizationPageHeader } from './organization-page-header';

/** Displays organization settings and the administrator delete flow. */
export function OrganizationSettingsPage({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [organization, setOrganization] = useState<OrganizationDetails | null>(
    null,
  );
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void organizationsApi
      .details(orgId)
      .then((details) => {
        if (active) setOrganization(details);
      })
      .catch(() => {
        if (active) setError('组织设置暂时无法加载。');
      });
    return () => {
      active = false;
    };
  }, [orgId]);

  async function remove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== organization?.name) return;
    setBusy(true);
    try {
      await organizationsApi.remove(orgId);
      window.localStorage.removeItem('ibase:last-organization');
      toast.success('组织已删除');
      router.replace('/dashboard');
    } catch {
      toast.error('组织删除失败。请确认管理员权限。');
      setBusy(false);
    }
  }

  if (error) {
    return (
      <Alert className="rounded-[12px] border-[var(--console-line)] bg-white p-6 text-[var(--console-ink)]">
        <AlertTitle className="text-[20px] leading-7 tracking-[-0.4px]">
          无法加载组织设置
        </AlertTitle>
        <AlertDescription className="mt-2 text-[var(--console-body)]">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!organization) {
    return (
      <p aria-live="polite" className="text-sm text-[var(--console-body)]">
        正在加载组织设置…
      </p>
    );
  }

  if (organization.currentRole !== 'admin') {
    return (
      <Alert className="rounded-[12px] border-[var(--console-line)] bg-white text-[var(--console-ink)]">
        <AlertTitle>无权访问</AlertTitle>
        <AlertDescription className="text-[var(--console-body)]">
          只有组织管理员可以访问此页面。
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <OrganizationPageHeader
        title="组织设置"
        description="配置组织的访问与危险操作。"
      />

      <Card className="max-w-2xl rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
        <CardHeader className="p-6 pb-4 sm:p-8 sm:pb-6">
          <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--console-error-deep)]">
            危险操作
          </p>
          <CardTitle className="mt-2 text-[20px] font-semibold leading-7 tracking-[-0.4px] text-[var(--console-ink)]">
            删除组织
          </CardTitle>
          <CardDescription className="text-sm leading-5 text-[var(--console-body)]">
            这会永久删除「{organization.name}
            」的成员关系与邀请记录。全局账号和其他组织不会受影响。
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
          <form
            className="space-y-6 border-t border-[var(--console-line)] pt-6"
            onSubmit={(event) => void remove(event)}
          >
            <Field>
              <FieldLabel htmlFor="confirm-name">输入组织名称以确认</FieldLabel>
              <Input
                autoComplete="off"
                className="h-10 rounded-[6px] border-[var(--console-line)] bg-white px-3 text-sm focus-visible:ring-[var(--console-blue)]"
                id="confirm-name"
                onChange={(event) => setConfirmation(event.target.value)}
                value={confirmation}
              />
            </Field>
            <Button
              className="h-11 rounded-[6px] bg-[var(--console-error)] px-1.5 text-sm text-white hover:bg-[var(--console-error-deep)]"
              disabled={busy || confirmation !== organization.name}
              type="submit"
              variant="destructive"
            >
              {busy ? '删除中…' : '永久删除组织'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

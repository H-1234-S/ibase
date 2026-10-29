'use client';

import { use, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { OrganizationDetails } from '@ibase/shared-types';
import { Button } from '@ibase/ui/components/ui/button';
import { Input } from '@ibase/ui/components/ui/input';
import { toast } from '@ibase/ui/components/ui/sonner';
import { organizationsApi } from '../../../../features/organizations/api/organizations-api';

export default function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
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
      <section
        className="rounded-[12px] border border-[var(--console-line)] bg-white p-6"
        role="alert"
      >
        <h1 className="text-[20px] font-semibold leading-7 tracking-[-0.4px] text-[var(--console-ink)]">
          无法加载组织设置
        </h1>
        <p className="mt-2 text-sm text-[var(--console-body)]">{error}</p>
      </section>
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
      <p
        className="rounded-[12px] border border-[var(--console-line)] bg-white p-6 text-sm text-[var(--console-body)]"
        role="alert"
      >
        只有组织管理员可以访问此页面。
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--console-mute)]">
          工作区
        </p>
        <h1 className="mt-2 text-[32px] font-semibold leading-10 tracking-[-1.28px] text-[var(--console-ink)]">
          组织设置
        </h1>
        <p className="mt-2 text-sm leading-5 text-[var(--console-body)]">
          配置组织的访问与危险操作。
        </p>
      </header>

      <section className="max-w-2xl rounded-[12px] border border-[var(--console-line)] bg-white p-6">
        <p className="font-mono text-xs font-medium uppercase leading-4 text-[#c50000]">
          危险操作
        </p>
        <h2 className="mt-2 text-[20px] font-semibold leading-7 tracking-[-0.4px] text-[var(--console-ink)]">
          删除组织
        </h2>
        <p className="mt-2 text-sm leading-5 text-[var(--console-body)]">
          这会永久删除「{organization.name}
          」的成员关系与邀请记录。全局账号和其他组织不会受影响。
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => void remove(event)}
        >
          <label
            className="block space-y-2 text-sm font-medium text-[var(--console-ink)]"
            htmlFor="confirm-name"
          >
            输入组织名称以确认
            <Input
              autoComplete="off"
              className="h-10 rounded-[6px] border-[var(--console-line)] bg-white"
              id="confirm-name"
              onChange={(event) => setConfirmation(event.target.value)}
              value={confirmation}
            />
          </label>
          <Button
            className="h-10 rounded-[6px] bg-[#ee0000] px-1.5 text-white hover:bg-[#c50000]"
            disabled={busy || confirmation !== organization.name}
            type="submit"
          >
            {busy ? '删除中…' : '永久删除组织'}
          </Button>
        </form>
      </section>
    </div>
  );
}

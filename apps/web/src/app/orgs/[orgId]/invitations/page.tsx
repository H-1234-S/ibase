'use client';

import { use, useCallback, useEffect, useState, type FormEvent } from 'react';
import type { OrganizationInvitation } from '@ibase/shared-types';
import { Button } from '@ibase/ui/components/ui/button';
import { Input } from '@ibase/ui/components/ui/input';
import { toast } from '@ibase/ui/components/ui/sonner';
import { organizationsApi } from '../../../../features/organizations/api/organizations-api';

export default function InvitationsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const [email, setEmail] = useState('');
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const organization = await organizationsApi.details(orgId);
      if (organization.currentRole !== 'admin') {
        setAccessDenied(true);
        return;
      }
      setInvitations(await organizationsApi.invitations(orgId));
      setAccessDenied(false);
    } catch {
      setLoadError('邀请记录暂时无法加载。');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <p aria-live="polite" className="text-sm text-[var(--console-body)]">
        正在验证邀请管理权限…
      </p>
    );
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await organizationsApi.invite(orgId, email.trim().toLowerCase());
      setEmail('');
      toast.success('邀请邮件已发送');
      await load();
    } catch {
      toast.error('邀请发送失败。请检查邮箱、权限或现有邀请状态。');
    } finally {
      setBusy(false);
    }
  }

  async function resend(invitationId: string) {
    setRowBusy(invitationId);
    try {
      await organizationsApi.resend(orgId, invitationId);
      toast.success('邀请邮件已重发');
    } catch {
      toast.error('邀请重发失败，请稍后重试。');
    } finally {
      setRowBusy('');
    }
  }

  async function revoke(invitationId: string) {
    if (!window.confirm('撤销此邀请？已发送的邀请链接将立即失效。')) return;
    setRowBusy(invitationId);
    try {
      await organizationsApi.revoke(orgId, invitationId);
      toast.success('邀请已撤销');
      await load();
    } catch {
      toast.error('邀请撤销失败。');
    } finally {
      setRowBusy('');
    }
  }

  if (accessDenied) {
    return (
      <p
        className="rounded-[12px] border border-[var(--console-line)] bg-white p-6 text-sm text-[var(--console-body)]"
        role="alert"
      >
        只有组织管理员可以管理邀请。
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
          邀请成员
        </h1>
        <p className="mt-2 text-sm leading-5 text-[var(--console-body)]">
          发送 member 邀请，对方需验证此邮箱后才能加入。
        </p>
      </header>

      <form
        className="flex max-w-2xl flex-wrap items-end gap-3 rounded-[12px] border border-[var(--console-line)] bg-white p-6"
        onSubmit={(event) => void invite(event)}
      >
        <label className="min-w-64 flex-1 space-y-2 text-sm font-medium text-[var(--console-ink)]">
          邮箱地址
          <Input
            autoComplete="email"
            className="h-10 rounded-[6px] border-[var(--console-line)] bg-white"
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
            type="email"
            value={email}
          />
        </label>
        <Button
          className="h-10 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-white"
          disabled={busy}
          type="submit"
        >
          {busy ? '发送中…' : '邀请为成员'}
        </Button>
      </form>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[20px] font-semibold leading-7 tracking-[-0.4px] text-[var(--console-ink)]">
            邀请记录
          </h2>
          <span className="text-xs text-[var(--console-mute)]">
            {invitations.length} 条
          </span>
        </div>
        {loadError ? (
          <div
            className="rounded-[12px] border border-[var(--console-line)] bg-white p-6"
            role="alert"
          >
            <p className="text-sm text-[var(--console-body)]">{loadError}</p>
            <Button
              className="mt-4 h-9 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-white"
              onClick={() => void load()}
              type="button"
            >
              重试
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[12px] border border-[var(--console-line)] bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[var(--console-body)]">
                <tr className="border-b border-[var(--console-line)]">
                  <th className="px-5 py-3 font-medium">邮箱</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium">有效期至</th>
                  <th className="px-5 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      className="px-5 py-8 text-center text-[var(--console-mute)]"
                      colSpan={4}
                    >
                      正在加载邀请…
                    </td>
                  </tr>
                ) : invitations.length ? (
                  invitations.map((item) => (
                    <tr
                      className="border-b border-[var(--console-line)] last:border-0"
                      key={item.id}
                    >
                      <td className="px-5 py-4 font-medium text-[var(--console-ink)]">
                        {item.email}
                      </td>
                      <td className="px-5 py-4 text-[var(--console-body)]">
                        {item.status === 'pending'
                          ? '待接受'
                          : item.status === 'accepted'
                            ? '已接受'
                            : item.status === 'revoked'
                              ? '已撤销'
                              : '已过期'}
                      </td>
                      <td className="px-5 py-4 text-[var(--console-mute)]">
                        {new Date(item.expiresAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        {item.status === 'pending' && (
                          <div className="flex gap-3">
                            <button
                              className="underline underline-offset-4 disabled:opacity-50"
                              disabled={Boolean(rowBusy)}
                              onClick={() => void resend(item.id)}
                              type="button"
                            >
                              {rowBusy === item.id ? '处理中…' : '重发'}
                            </button>
                            <button
                              className="text-[#c50000] underline underline-offset-4 disabled:opacity-50"
                              disabled={Boolean(rowBusy)}
                              onClick={() => void revoke(item.id)}
                              type="button"
                            >
                              撤销
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-5 py-8 text-center text-[var(--console-mute)]"
                      colSpan={4}
                    >
                      还没有邀请记录。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

'use client';

import { use, useCallback, useEffect, useState } from 'react';
import type { OrganizationMember } from '@ibase/shared-types';
import { Button } from '@ibase/ui/components/ui/button';
import { toast } from '@ibase/ui/components/ui/sonner';
import { useAuth } from '../../../../features/auth/hooks/use-auth';
import { organizationsApi } from '../../../../features/organizations/api/organizations-api';

export default function MembersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const { user } = useAuth();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMembers(await organizationsApi.members(orgId));
    } catch {
      setError('成员列表暂时无法加载。');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const currentUserIsAdmin = members.some(
    (member) => member.userId === user?.id && member.role === 'admin',
  );

  async function changeRole(member: OrganizationMember) {
    const role = member.role === 'admin' ? 'member' : 'admin';
    const confirmation = window.confirm(
      `将 ${member.name} 的角色更改为${role === 'admin' ? '管理员' : '成员'}？`,
    );
    if (!confirmation) return;

    setBusyId(member.membershipId);
    try {
      await organizationsApi.updateMember(orgId, member.membershipId, role);
      toast.success('成员角色已更新');
      await load();
    } catch {
      toast.error('角色更新失败。组织必须至少保留一位管理员。');
    } finally {
      setBusyId('');
    }
  }

  async function remove(member: OrganizationMember) {
    if (!window.confirm(`从组织中移除 ${member.name}？`)) return;

    setBusyId(member.membershipId);
    try {
      await organizationsApi.removeMember(orgId, member.membershipId);
      toast.success('成员已移除');
      await load();
    } catch {
      toast.error('成员移除失败。组织必须至少保留一位管理员。');
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--console-mute)]">
            工作区
          </p>
          <h1 className="mt-2 text-[32px] font-semibold leading-10 tracking-[-1.28px] text-[var(--console-ink)]">
            成员
          </h1>
          <p className="mt-2 text-sm leading-5 text-[var(--console-body)]">
            查看组织成员及其访问角色。
          </p>
        </div>
        <Button
          className="h-9 rounded-[6px] border-[var(--console-line)] px-1.5 text-sm"
          onClick={() => void load()}
          type="button"
          variant="outline"
        >
          刷新
        </Button>
      </header>

      {error ? (
        <section
          className="rounded-[12px] border border-[var(--console-line)] bg-white p-6"
          role="alert"
        >
          <p className="text-sm text-[var(--console-body)]">{error}</p>
          <Button
            className="mt-4 h-9 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-white"
            onClick={() => void load()}
            type="button"
          >
            重试
          </Button>
        </section>
      ) : loading ? (
        <p aria-live="polite" className="text-sm text-[var(--console-body)]">
          正在加载成员…
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-[var(--console-line)] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[var(--console-body)]">
              <tr className="border-b border-[var(--console-line)]">
                <th className="px-5 py-3 font-medium">成员</th>
                <th className="px-5 py-3 font-medium">邮箱</th>
                <th className="px-5 py-3 font-medium">角色</th>
                <th className="px-5 py-3 font-medium">加入时间</th>
                {currentUserIsAdmin && (
                  <th className="px-5 py-3 font-medium">操作</th>
                )}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  className="border-b border-[var(--console-line)] last:border-0"
                  key={member.membershipId}
                >
                  <td className="px-5 py-4 font-medium text-[var(--console-ink)]">
                    {member.name}
                    {member.userId === user?.id && (
                      <span className="ml-2 text-xs font-normal text-[var(--console-mute)]">
                        你
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[var(--console-body)]">
                    {member.email}
                  </td>
                  <td className="px-5 py-4 text-[var(--console-body)]">
                    {member.role === 'admin' ? '管理员' : '成员'}
                  </td>
                  <td className="px-5 py-4 text-[var(--console-mute)]">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  {currentUserIsAdmin && (
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button
                          className="text-[var(--console-body)] underline underline-offset-4 disabled:opacity-50"
                          disabled={Boolean(busyId)}
                          onClick={() => void changeRole(member)}
                          type="button"
                        >
                          {busyId === member.membershipId
                            ? '处理中…'
                            : member.role === 'admin'
                              ? '降为成员'
                              : '设为管理员'}
                        </button>
                        <button
                          className="text-[#c50000] underline underline-offset-4 disabled:opacity-50"
                          disabled={Boolean(busyId)}
                          onClick={() => void remove(member)}
                          type="button"
                        >
                          移除
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td
                    className="px-5 py-8 text-center text-[var(--console-mute)]"
                    colSpan={currentUserIsAdmin ? 5 : 4}
                  >
                    还没有成员。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

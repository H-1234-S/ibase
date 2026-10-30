'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from '@ibase/ui/components/ui/sonner';
import type { OrganizationMember, OrganizationRole } from '@ibase/shared-types';
import { organizationsApi } from '../api/organizations-api';
import { getApiErrorMessage } from '../../auth/api/auth-error-message';
import { MailIcon } from './org-console-icons';
import {
  ErrorNote,
  PageHeader,
  buttonDangerClass,
  buttonGhostClass,
  cardClass,
  formatDate,
  pageContainerClass,
  selectClass,
} from './org-console-ui';

/** Organization member management: roles, removal, and entry to invitations. */
export function OrgMembersPage({ orgId }: { orgId: string }) {
  const [members, setMembers] = useState<OrganizationMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleBusy, setRoleBusy] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const load = useCallback(() => {
    organizationsApi
      .members(orgId)
      .then(setMembers)
      .catch((err) =>
        setError(getApiErrorMessage(err, '成员列表加载失败，请刷新重试。')),
      );
  }, [orgId]);

  useEffect(() => {
    setMembers(null);
    setError(null);
    setRemoveId(null);
    load();
  }, [load]);

  async function changeRole(membershipId: string, role: OrganizationRole) {
    setRoleBusy(membershipId);
    try {
      await organizationsApi.updateMember(orgId, membershipId, role);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, '角色更新失败，请稍后重试。'));
    } finally {
      setRoleBusy(null);
    }
  }

  async function removeMember(membershipId: string) {
    setRemoveBusy(true);
    try {
      await organizationsApi.removeMember(orgId, membershipId);
      setRemoveId(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, '移除成员失败，请稍后重试。'));
    } finally {
      setRemoveBusy(false);
    }
  }

  return (
    <div className={pageContainerClass}>
      <PageHeader
        eyebrow="成员管理"
        title={`成员${members ? `（${members.length}）` : ''}`}
        actions={
          <Link
            href={`/orgs/${orgId}/invitations`}
            className={buttonGhostClass}
          >
            <MailIcon className="size-4" />
            邀请成员
          </Link>
        }
      />

      {error && (
        <div className="mt-6">
          <ErrorNote message={error} />
        </div>
      )}
      {!error && members === null && (
        <p className="mt-6 text-[14px] text-[#8f8f8f]">加载中…</p>
      )}

      {members && members.length > 0 && (
        <div className={`${cardClass} mt-6 overflow-x-auto`}>
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-[#ebebeb]">
                <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                  成员
                </th>
                <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                  角色
                </th>
                <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                  加入时间
                </th>
                <th className="px-6 py-3 text-right text-[12px] font-medium text-[#8f8f8f]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.membershipId}
                  className="border-b border-[#ebebeb] last:border-b-0"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium tracking-[-0.28px] text-[#171717]">
                        {member.name}
                      </span>
                      <span className="text-[12px] leading-4 text-[#8f8f8f]">
                        {member.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className={selectClass}
                      disabled={roleBusy === member.membershipId}
                      value={member.role}
                      onChange={(event) => {
                        const role =
                          event.target.value === 'admin' ? 'admin' : 'member';
                        void changeRole(member.membershipId, role);
                      }}
                    >
                      <option value="member">成员</option>
                      <option value="admin">管理员</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-[#4d4d4d]">
                    {formatDate(member.joinedAt)}
                  </td>
                  <td className="px-6 py-4">
                    {removeId === member.membershipId ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className={buttonDangerClass}
                          disabled={removeBusy}
                          onClick={() => void removeMember(member.membershipId)}
                        >
                          确认移除
                        </button>
                        <button
                          type="button"
                          className={buttonGhostClass}
                          disabled={removeBusy}
                          onClick={() => setRemoveId(null)}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-[14px] text-[#4d4d4d] hover:text-[#ee0000]"
                          onClick={() => setRemoveId(member.membershipId)}
                        >
                          移除
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {members && members.length === 0 && (
        <div
          className={`${cardClass} mt-6 border-dashed p-16 text-center text-[14px] text-[#4d4d4d]`}
        >
          暂无成员
        </div>
      )}
    </div>
  );
}

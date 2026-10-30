'use client';

import { useCallback, useEffect, useState } from 'react';
import { FormEvent } from 'react';
import { toast } from '@ibase/ui/components/ui/sonner';
import type {
  OrganizationInvitation,
  OrganizationInvitationStatus,
  OrganizationRole,
} from '@ibase/shared-types';
import { organizationsApi } from '../api/organizations-api';
import { ApiRequestError } from '../../auth/api/auth-api';
import { getApiErrorMessage } from '../../auth/api/auth-error-message';
import { RefreshIcon } from './org-console-icons';
import {
  ErrorNote,
  PageHeader,
  RoleBadge,
  buttonPrimaryClass,
  cardClass,
  formatDate,
  inputClass,
  pageContainerClass,
  selectClass,
} from './org-console-ui';

const statusLabels: Record<OrganizationInvitationStatus, string> = {
  pending: '待处理',
  accepted: '已接受',
  revoked: '已撤销',
  expired: '已过期',
};

function StatusBadge({ status }: { status: OrganizationInvitationStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[12px] leading-4 ${
        status === 'pending'
          ? 'bg-[#d3e5ff] text-[#0761d1]'
          : status === 'accepted'
            ? 'bg-[#f2f2f2] text-[#171717]'
            : 'bg-[#f2f2f2] text-[#8f8f8f]'
      }`}
    >
      {statusLabels[status]}
    </span>
  );
}

/** Organization invitation management: send, resend, and revoke invites. */
export function OrgInvitationsPage({ orgId }: { orgId: string }) {
  const [invitations, setInvitations] = useState<
    OrganizationInvitation[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationRole>('member');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    organizationsApi
      .invitations(orgId)
      .then(setInvitations)
      .catch((err) =>
        setError(getApiErrorMessage(err, '邀请列表加载失败，请刷新重试。')),
      );
  }, [orgId]);

  useEffect(() => {
    setInvitations(null);
    setError(null);
    load();
  }, [load]);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await organizationsApi.invite(orgId, email);
      setEmail('');
      load();
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        err.validationErrors?.some((item) => item.field === 'email')
      ) {
        // Email problems stay inline under the form; the rest go to a toast.
        setFormError(getApiErrorMessage(err, '邮箱不符合要求。'));
      } else {
        toast.error(getApiErrorMessage(err, '发送邀请失败，请稍后重试。'));
      }
    } finally {
      setBusy(false);
    }
  }

  async function resend(invitationId: string) {
    setActionBusy(invitationId);
    try {
      await organizationsApi.resend(orgId, invitationId);
      toast.success('邀请已重新发送。');
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, '重新发送失败，请稍后重试。'));
    } finally {
      setActionBusy(null);
    }
  }

  async function revoke(invitationId: string) {
    setActionBusy(invitationId);
    try {
      await organizationsApi.revoke(orgId, invitationId);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, '撤销邀请失败，请稍后重试。'));
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <div className={pageContainerClass}>
      <PageHeader eyebrow="邀请管理" title="邀请" />

      <form
        className={`${cardClass} mt-6 flex flex-wrap items-center gap-3 p-6`}
        onSubmit={invite}
      >
        <input
          type="email"
          required
          maxLength={254}
          placeholder="受邀人邮箱"
          className={`${inputClass} min-w-64 flex-1`}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <select
          className={selectClass}
          value={role}
          onChange={(event) =>
            setRole(event.target.value === 'admin' ? 'admin' : 'member')
          }
        >
          <option value="member">成员</option>
          <option value="admin">管理员</option>
        </select>
        <button type="submit" className={buttonPrimaryClass} disabled={busy}>
          {busy ? '发送中…' : '发送邀请'}
        </button>
        {formError && (
          <div className="w-full">
            <ErrorNote message={formError} />
          </div>
        )}
      </form>

      {error && (
        <div className="mt-6">
          <ErrorNote message={error} />
        </div>
      )}
      {!error && invitations === null && (
        <p className="mt-6 text-[14px] text-[#8f8f8f]">加载中…</p>
      )}

      {invitations && invitations.length > 0 && (
        <div className={`${cardClass} mt-6 overflow-x-auto`}>
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-[#ebebeb]">
                <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                  邮箱
                </th>
                <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                  角色
                </th>
                <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                  状态
                </th>
                <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                  过期时间
                </th>
                <th className="px-6 py-3 text-[12px] font-medium text-[#8f8f8f]">
                  邀请人
                </th>
                <th className="px-6 py-3 text-right text-[12px] font-medium text-[#8f8f8f]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr
                  key={invitation.id}
                  className="border-b border-[#ebebeb] last:border-b-0"
                >
                  <td className="px-6 py-4 font-medium tracking-[-0.28px] text-[#171717]">
                    {invitation.email}
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={invitation.role} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={invitation.status} />
                  </td>
                  <td className="px-6 py-4 text-[#4d4d4d]">
                    {formatDate(invitation.expiresAt)}
                  </td>
                  <td className="px-6 py-4 text-[#4d4d4d]">
                    {invitation.invitedByName}
                  </td>
                  <td className="px-6 py-4">
                    {invitation.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-4">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-[14px] text-[#4d4d4d] hover:text-[#171717] disabled:opacity-50"
                          disabled={actionBusy === invitation.id}
                          onClick={() => void resend(invitation.id)}
                        >
                          <RefreshIcon className="size-4" />
                          重新发送
                        </button>
                        <button
                          type="button"
                          className="text-[14px] text-[#4d4d4d] hover:text-[#ee0000] disabled:opacity-50"
                          disabled={actionBusy === invitation.id}
                          onClick={() => void revoke(invitation.id)}
                        >
                          撤销
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invitations && invitations.length === 0 && (
        <div
          className={`${cardClass} mt-6 border-dashed p-16 text-center text-[14px] text-[#4d4d4d]`}
        >
          暂无邀请记录
        </div>
      )}
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from '@ibase/ui/components/ui/sonner';
import type { OrganizationDetails } from '@ibase/shared-types';
import { organizationsApi } from '../api/organizations-api';
import { getApiErrorMessage } from '../../auth/api/auth-error-message';
import { TrashIcon } from './org-console-icons';
import {
  ErrorNote,
  PageHeader,
  RoleBadge,
  buttonDangerClass,
  buttonGhostClass,
  cardClass,
  formatDate,
  inputClass,
  pageContainerClass,
} from './org-console-ui';

/** Organization settings: profile overview and destructive delete flow. */
export function OrgSettingsPage({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [org, setOrg] = useState<OrganizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    organizationsApi
      .details(orgId)
      .then(setOrg)
      .catch((err) =>
        setError(getApiErrorMessage(err, '组织信息加载失败，请刷新重试。')),
      );
  }, [orgId]);

  async function remove() {
    setBusy(true);
    try {
      await organizationsApi.remove(orgId);
      router.push('/orgs');
    } catch (err) {
      toast.error(getApiErrorMessage(err, '删除组织失败，请稍后重试。'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={pageContainerClass}>
      <PageHeader eyebrow="组织设置" title="设置" />

      {error && (
        <div className="mt-6">
          <ErrorNote message={error} />
        </div>
      )}
      {!error && !org && (
        <p className="mt-6 text-[14px] text-[#8f8f8f]">加载中…</p>
      )}

      {org && (
        <div className="mt-6 flex flex-col gap-6">
          <section className={`${cardClass} p-6`}>
            <p className="font-mono text-[12px] font-medium text-[#8f8f8f]">
              组织信息
            </p>
            <dl className="mt-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#ebebeb] py-3">
                <dt className="text-[14px] text-[#8f8f8f]">名称</dt>
                <dd className="text-[14px] font-medium tracking-[-0.28px] text-[#171717]">
                  {org.name}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-[#ebebeb] py-3">
                <dt className="text-[14px] text-[#8f8f8f]">组织 ID</dt>
                <dd className="font-mono text-[14px] text-[#171717]">
                  {org.id}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-[#ebebeb] py-3">
                <dt className="text-[14px] text-[#8f8f8f]">创建时间</dt>
                <dd className="text-[14px] text-[#171717]">
                  {formatDate(org.createdAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-[14px] text-[#8f8f8f]">我的角色</dt>
                <dd>
                  <RoleBadge role={org.currentRole} />
                </dd>
              </div>
            </dl>
          </section>

          <section className={`${cardClass} p-6`}>
            <p className="font-mono text-[12px] font-medium text-[#8f8f8f]">
              危险区
            </p>
            {!confirming ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <p className="text-[14px] leading-6 text-[#4d4d4d]">
                  删除组织后无法恢复，所有成员、邀请与项目数据将被清除。
                </p>
                <button
                  type="button"
                  className={buttonDangerClass}
                  onClick={() => setConfirming(true)}
                >
                  <TrashIcon className="size-4" />
                  删除组织
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-[14px] leading-6 text-[#4d4d4d]">
                  输入组织名称{' '}
                  <span className="font-medium text-[#171717]">
                    「{org.name}」
                  </span>{' '}
                  以确认删除。
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    maxLength={64}
                    className={`${inputClass} max-w-72 flex-1`}
                    placeholder={org.name}
                    value={confirmName}
                    onChange={(event) => setConfirmName(event.target.value)}
                  />
                  <button
                    type="button"
                    className={buttonDangerClass}
                    disabled={busy || confirmName !== org.name}
                    onClick={() => void remove()}
                  >
                    {busy ? '删除中…' : '确认删除'}
                  </button>
                  <button
                    type="button"
                    className={buttonGhostClass}
                    disabled={busy}
                    onClick={() => {
                      setConfirming(false);
                      setConfirmName('');
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

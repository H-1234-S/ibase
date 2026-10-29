'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { OrganizationInvitationPreview } from '@ibase/shared-types';
import { Button } from '@ibase/ui/components/ui/button';
import { Card, CardContent } from '@ibase/ui/components/ui/card';
import { useAuth } from '../../../features/auth/hooks/use-auth';
import { ApiRequestError } from '../../../features/auth/api/auth-api';
import { organizationsApi } from '../../../features/organizations/api/organizations-api';

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [invitation, setInvitation] =
    useState<OrganizationInvitationPreview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void organizationsApi
      .preview(token)
      .then(setInvitation)
      .catch(() =>
        setError('此邀请无效或已无法使用。请联系组织管理员重新邀请。'),
      );
  }, [token]);
  async function accept() {
    setBusy(true);
    setError('');
    try {
      const result = await organizationsApi.accept(token);
      router.replace(`/orgs/${result.organizationId}/dashboard`);
    } catch (cause) {
      if (
        cause instanceof ApiRequestError &&
        cause.code === 'INVITATION_EMAIL_MISMATCH'
      )
        setError('当前账号邮箱与邀请邮箱不一致，请切换账号后重试。');
      else if (
        cause instanceof ApiRequestError &&
        cause.code === 'EMAIL_VERIFICATION_REQUIRED'
      )
        setError('请先完成邮箱验证，再接受邀请。');
      else setError('无法接受此邀请。请刷新页面或联系管理员。');
      setBusy(false);
    }
  }
  if (error && !invitation)
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 text-[var(--console-ink)]">
        <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--console-mute)]">
          组织邀请
        </p>
        <h1 className="mt-3 text-[32px] font-semibold leading-10 tracking-[-1.28px]">
          邀请暂时无法打开
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-5 text-[var(--console-body)]">
          {error}
        </p>
        <Link
          className="mt-6 w-fit text-sm text-[var(--console-body)] underline underline-offset-4"
          href="/login"
        >
          前往登录
        </Link>
      </main>
    );
  if (!invitation)
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 text-sm text-[var(--console-body)]">
        正在检查邀请…
      </main>
    );
  const next = `/invitations/${encodeURIComponent(token)}`;
  const usable =
    invitation.status === 'pending' &&
    new Date(invitation.expiresAt) > new Date();
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 text-[var(--console-ink)]">
      <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--console-mute)]">
        组织邀请
      </p>
      <h1 className="mt-3 text-[32px] font-semibold leading-10 tracking-[-1.28px]">
        加入 {invitation.organizationName}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-5 text-[var(--console-body)]">
        {invitation.invitedByName} 邀请 <strong>{invitation.email}</strong>{' '}
        以成员身份加入。
      </p>
      <Card className="mt-8 max-w-xl rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
        <CardContent className="p-6">
          {!usable ? (
            <p
              className="text-sm leading-5 text-[var(--console-body)]"
              role="status"
            >
              此邀请
              {invitation.status === 'revoked'
                ? '已撤销'
                : invitation.status === 'accepted'
                  ? '已接受'
                  : '已过期'}
              。请联系管理员。
            </p>
          ) : loading ? (
            <p className="text-sm text-[var(--console-body)]">
              正在检查登录状态…
            </p>
          ) : user ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--console-body)]">
                当前账号：
                <strong className="font-medium text-[var(--console-ink)]">
                  {user.email}
                </strong>
              </p>
              {error && (
                <p className="text-sm text-[#c50000]" role="alert">
                  {error}
                </p>
              )}
              <Button
                className="h-10 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-white"
                disabled={busy}
                onClick={() => void accept()}
              >
                {busy ? '正在接受…' : '接受邀请'}
              </Button>
              {error && (
                <Link
                  className="ml-3 text-sm underline underline-offset-4"
                  href={`/login?next=${encodeURIComponent(next)}`}
                >
                  切换账号
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="h-10 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-white"
              >
                <Link href={`/login?next=${encodeURIComponent(next)}`}>
                  登录并接受
                </Link>
              </Button>
              <Button
                asChild
                className="h-10 rounded-[6px] border-[var(--console-line)] bg-white px-1.5 text-[var(--console-ink)]"
                variant="outline"
              >
                <Link
                  href={`/register?next=${encodeURIComponent(next)}&email=${encodeURIComponent(invitation.email)}`}
                >
                  注册并接受
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

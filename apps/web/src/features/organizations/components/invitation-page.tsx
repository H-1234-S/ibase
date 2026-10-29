'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OrganizationInvitationPreview } from '@ibase/shared-types';
import { Button } from '@ibase/ui/components/ui/button';
import { Badge } from '@ibase/ui/components/ui/badge';
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
import { Skeleton } from '@ibase/ui/components/ui/skeleton';
import { useAuth } from '../../auth/hooks/use-auth';
import { ApiRequestError } from '../../auth/api/auth-api';
import { organizationsApi } from '../api/organizations-api';

/** Reviews an organization invitation and accepts it for the signed-in user. */
export function InvitationPage({ token }: { token: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [invitation, setInvitation] =
    useState<OrganizationInvitationPreview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setInvitation(null);
    setError('');
    void organizationsApi
      .preview(token)
      .then((preview) => {
        if (active) setInvitation(preview);
      })
      .catch(
        () =>
          active &&
          setError('此邀请无效或已无法使用。请联系组织管理员重新邀请。'),
      );

    return () => {
      active = false;
    };
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
  if (error && !invitation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--console-canvas)] px-6 py-16 text-[var(--console-ink)]">
        <div className="w-full max-w-xl">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--console-ink)] no-underline"
            href="/"
          >
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-[6px] bg-[var(--console-ink)] text-white"
            >
              i
            </span>
            ibase
          </Link>
          <Alert className="mt-8 rounded-[12px] border-[var(--console-line)] bg-white p-6 text-[var(--console-ink)]">
            <AlertTitle className="text-[20px] leading-7 tracking-[-0.4px]">
              邀请暂时无法打开
            </AlertTitle>
            <AlertDescription className="mt-2 text-[var(--console-body)]">
              {error}
            </AlertDescription>
            <Button
              asChild
              className="col-start-2 mt-4 h-11 w-fit rounded-[6px] px-1.5 text-sm text-[var(--console-ink)]"
              variant="outline"
            >
              <Link href="/login">前往登录</Link>
            </Button>
          </Alert>
        </div>
      </main>
    );
  }

  if (!invitation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--console-canvas)] px-6 py-16">
        <div aria-live="polite" aria-busy="true" className="w-full max-w-xl">
          <Skeleton className="h-4 w-24 rounded-[6px]" />
          <Skeleton className="mt-4 h-10 w-64 rounded-[6px]" />
          <Skeleton className="mt-3 h-4 w-full max-w-md rounded-[6px]" />
          <Skeleton className="mt-8 h-48 rounded-[12px]" />
        </div>
      </main>
    );
  }
  const next = `/invitations/${encodeURIComponent(token)}`;
  const usable =
    invitation.status === 'pending' &&
    new Date(invitation.expiresAt) > new Date();
  return (
    <main className="min-h-screen bg-[var(--console-canvas)] px-6 py-16 text-[var(--console-ink)] sm:py-24">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--console-ink)] no-underline"
          href="/"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-[6px] bg-[var(--console-ink)] text-white"
          >
            i
          </span>
          ibase
        </Link>
        <header className="mt-16 max-w-2xl sm:mt-16">
          <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--console-mute)]">
            组织邀请
          </p>
          <h1 className="mt-3 text-[32px] font-semibold leading-10 tracking-[-1.28px]">
            加入 {invitation.organizationName}
          </h1>
          <p className="mt-3 text-sm leading-5 text-[var(--console-body)]">
            {invitation.invitedByName} 邀请 <strong>{invitation.email}</strong>{' '}
            以成员身份加入。
          </p>
        </header>
        <Card className="mt-8 max-w-2xl rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
          <CardHeader className="gap-3 p-6 pb-4 sm:p-8 sm:pb-6">
            <Badge
              variant="outline"
              className="w-fit rounded-[6px] border-[var(--console-line)] text-[var(--console-body)]"
            >
              成员邀请
            </Badge>
            <CardTitle className="text-[20px] font-semibold leading-7 tracking-[-0.4px]">
              邀请详情
            </CardTitle>
            <CardDescription className="text-sm leading-5 text-[var(--console-body)]">
              邀请邮箱：{invitation.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
            {!usable ? (
              <Alert className="border-[var(--console-line)] bg-[var(--console-canvas)] text-[var(--console-ink)]">
                <AlertTitle>此邀请已无法使用</AlertTitle>
                <AlertDescription className="text-[var(--console-body)]">
                  {invitation.status === 'revoked'
                    ? '邀请已撤销。'
                    : invitation.status === 'accepted'
                      ? '邀请已接受。'
                      : '邀请已过期。'}
                  请联系管理员。
                </AlertDescription>
              </Alert>
            ) : loading ? (
              <div aria-live="polite" aria-busy="true" className="space-y-3">
                <Skeleton className="h-4 w-52 rounded-[6px]" />
                <Skeleton className="h-10 w-36 rounded-[6px]" />
              </div>
            ) : user ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[var(--console-line)] py-4">
                  <span className="text-sm text-[var(--console-body)]">
                    当前登录账号
                  </span>
                  <strong className="text-sm font-medium text-[var(--console-ink)]">
                    {user.email}
                  </strong>
                </div>
                {error && (
                  <Alert className="border-[var(--console-line)] text-[var(--console-error-deep)]">
                    <AlertDescription className="text-[var(--console-error-deep)]">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  className="h-11 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
                  disabled={busy}
                  onClick={() => void accept()}
                  type="button"
                >
                  {busy ? '正在接受…' : '接受邀请'}
                </Button>
                {error && (
                  <Link
                    className="ml-3 text-sm text-[var(--console-body)] underline underline-offset-4"
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
                  className="h-11 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
                >
                  <Link href={`/login?next=${encodeURIComponent(next)}`}>
                    登录并接受
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-11 rounded-[6px] border-[var(--console-line)] bg-white px-1.5 text-sm text-[var(--console-ink)] hover:bg-[var(--console-soft)]"
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
      </div>
    </main>
  );
}

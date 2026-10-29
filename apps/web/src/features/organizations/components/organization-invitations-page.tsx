'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { OrganizationInvitation } from '@ibase/shared-types';
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
  CardHeader,
  CardTitle,
} from '@ibase/ui/components/ui/card';
import { Field, FieldLabel } from '@ibase/ui/components/ui/field';
import { Input } from '@ibase/ui/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableCaption,
  TableRow,
} from '@ibase/ui/components/ui/table';
import { Skeleton } from '@ibase/ui/components/ui/skeleton';
import { toast } from '@ibase/ui/components/ui/sonner';
import { organizationsApi } from '../api/organizations-api';
import { OrganizationPageHeader } from './organization-page-header';
import { OrganizationConfirmDialog } from './organization-confirm-dialog';

/** Manages invitations for the selected organization. */
export function OrganizationInvitationsPage({ orgId }: { orgId: string }) {
  const [email, setEmail] = useState('');
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [pendingRevokeId, setPendingRevokeId] = useState('');

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
      <div aria-live="polite" aria-busy="true" className="space-y-6">
        <Skeleton className="h-4 w-24 rounded-[6px]" />
        <Skeleton className="h-10 w-48 rounded-[6px]" />
        <Skeleton className="h-28 rounded-[12px]" />
        <Skeleton className="h-56 rounded-[12px]" />
      </div>
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

  function revoke(invitationId: string) {
    setPendingRevokeId(invitationId);
  }

  async function confirmRevoke() {
    const invitationId = pendingRevokeId;
    if (!invitationId) return;
    setRowBusy(invitationId);
    try {
      await organizationsApi.revoke(orgId, invitationId);
      toast.success('邀请已撤销');
      await load();
    } catch {
      toast.error('邀请撤销失败。');
    } finally {
      setRowBusy('');
      setPendingRevokeId('');
    }
  }

  if (accessDenied) {
    return (
      <Alert className="rounded-[12px] border-[var(--console-line)] bg-white text-[var(--console-ink)]">
        <AlertTitle>无权管理邀请</AlertTitle>
        <AlertDescription className="text-[var(--console-body)]">
          只有组织管理员可以管理邀请。
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div>
        <OrganizationPageHeader
          title="邀请成员"
          description="对方验证受邀邮箱后，即可加入当前组织。"
        />

        <Card className="mb-8 max-w-2xl rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[20px] font-semibold leading-7 tracking-[-0.4px]">
              发送邀请
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <form
              className="flex flex-wrap items-end gap-4"
              onSubmit={(event) => void invite(event)}
            >
              <Field className="min-w-64 flex-1">
                <FieldLabel htmlFor="invitation-email">邮箱地址</FieldLabel>
                <Input
                  id="invitation-email"
                  autoComplete="email"
                  className="h-10 rounded-[6px] border-[var(--console-line)] bg-white px-3 text-sm focus-visible:ring-[var(--console-blue)]"
                  maxLength={254}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={email}
                />
              </Field>
              <Button
                className="h-11 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
                disabled={busy}
                type="submit"
              >
                {busy ? '发送中…' : '发送邀请'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <section>
          {loadError ? (
            <Alert className="rounded-[12px] border-[var(--console-line)] bg-white text-[var(--console-ink)]">
              <AlertTitle>邀请记录暂不可用</AlertTitle>
              <AlertDescription className="text-[var(--console-body)]">
                {loadError}
              </AlertDescription>
              <Button
                className="col-start-2 mt-4 h-11 w-fit rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
                onClick={() => void load()}
                type="button"
              >
                重试
              </Button>
            </Alert>
          ) : (
            <Card className="rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
              <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 border-b border-[var(--console-line)] p-6">
                <CardTitle className="text-[20px] font-semibold leading-7 tracking-[-0.4px]">
                  邀请记录
                </CardTitle>
                <Badge
                  variant="outline"
                  className="rounded-[6px] border-[var(--console-line)] text-[var(--console-body)]"
                >
                  {invitations.length} 条
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table className="min-w-[640px] text-sm">
                  <TableCaption className="sr-only">组织邀请记录</TableCaption>
                  <TableHeader className="text-[var(--console-body)]">
                    <TableRow className="border-[var(--console-line)] hover:bg-transparent">
                      <TableHead className="px-4 font-medium">邮箱</TableHead>
                      <TableHead className="px-4 font-medium">状态</TableHead>
                      <TableHead className="px-4 font-medium">
                        有效期至
                      </TableHead>
                      <TableHead className="px-4 font-medium">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((item) => (
                      <TableRow
                        className="border-[var(--console-line)] hover:bg-[var(--console-canvas)]"
                        key={item.id}
                      >
                        <TableCell className="px-4 py-4 font-medium text-[var(--console-ink)]">
                          {item.email}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge
                            variant={
                              item.status === 'pending'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="rounded-[6px] border-[var(--console-line)] text-[var(--console-body)] data-[variant=secondary]:bg-[var(--console-soft)]"
                          >
                            {item.status === 'pending'
                              ? '待接受'
                              : item.status === 'accepted'
                                ? '已接受'
                                : item.status === 'revoked'
                                  ? '已撤销'
                                  : '已过期'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-[var(--console-mute)]">
                          {new Date(item.expiresAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {item.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                className="h-11 min-w-11 rounded-[6px] px-2 text-xs text-[var(--console-body)] hover:bg-[var(--console-soft)] hover:text-[var(--console-ink)]"
                                disabled={Boolean(rowBusy)}
                                onClick={() => void resend(item.id)}
                                type="button"
                                variant="ghost"
                              >
                                {rowBusy === item.id ? '处理中…' : '重发'}
                              </Button>
                              <Button
                                className="h-11 min-w-11 rounded-[6px] px-2 text-xs text-[var(--console-error-deep)] hover:bg-[var(--console-soft)] hover:text-[var(--console-error)]"
                                disabled={Boolean(rowBusy)}
                                onClick={() => void revoke(item.id)}
                                type="button"
                                variant="ghost"
                              >
                                撤销
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {invitations.length === 0 && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          className="h-28 text-center text-[var(--console-mute)]"
                          colSpan={4}
                        >
                          还没有邀请记录。
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
      <OrganizationConfirmDialog
        open={Boolean(pendingRevokeId)}
        onOpenChange={(open) => {
          if (!open) setPendingRevokeId('');
        }}
        title="撤销邀请？"
        description="已发送的邀请链接将立即失效。"
        confirmLabel="撤销邀请"
        destructive
        onConfirm={() => void confirmRevoke()}
      />
    </>
  );
}

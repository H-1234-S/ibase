'use client';

import { useCallback, useEffect, useState } from 'react';
import type { OrganizationMember, OrganizationRole } from '@ibase/shared-types';
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
import { useAuth } from '../../auth/hooks/use-auth';
import { organizationsApi } from '../api/organizations-api';
import { OrganizationPageHeader } from './organization-page-header';
import { OrganizationConfirmDialog } from './organization-confirm-dialog';

/** Lists organization members and provides role and removal actions. */
export function OrganizationMembersPage({ orgId }: { orgId: string }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [pendingAction, setPendingAction] = useState<
    | { type: 'role'; member: OrganizationMember; role: OrganizationRole }
    | { type: 'remove'; member: OrganizationMember }
    | null
  >(null);

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

  function changeRole(member: OrganizationMember) {
    const role = member.role === 'admin' ? 'member' : 'admin';
    setPendingAction({ type: 'role', member, role });
  }

  function remove(member: OrganizationMember) {
    setPendingAction({ type: 'remove', member });
  }

  async function confirmAction() {
    if (!pendingAction) return;
    const { member } = pendingAction;
    setBusyId(member.membershipId);
    try {
      if (pendingAction.type === 'role') {
        await organizationsApi.updateMember(
          orgId,
          member.membershipId,
          pendingAction.role,
        );
        toast.success('成员角色已更新');
      } else {
        await organizationsApi.removeMember(orgId, member.membershipId);
        toast.success('成员已移除');
      }
      await load();
    } catch {
      toast.error(
        pendingAction.type === 'role'
          ? '角色更新失败。组织必须至少保留一位管理员。'
          : '成员移除失败。组织必须至少保留一位管理员。',
      );
    } finally {
      setBusyId('');
      setPendingAction(null);
    }
  }

  return (
    <>
      <div>
        <OrganizationPageHeader
          title="成员"
          description="查看组织成员及其访问角色。"
          action={
            <Button
              className="h-11 rounded-[6px] border-[var(--console-line)] bg-white px-1.5 text-sm text-[var(--console-ink)] hover:bg-[var(--console-soft)]"
              onClick={() => void load()}
              type="button"
              variant="outline"
            >
              刷新列表
            </Button>
          }
        />

        {error ? (
          <Alert className="rounded-[12px] border-[var(--console-line)] bg-white p-6 text-[var(--console-ink)]">
            <AlertTitle>成员列表暂不可用</AlertTitle>
            <AlertDescription className="text-[var(--console-body)]">
              {error}
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
                组织成员
              </CardTitle>
              {!loading && (
                <Badge
                  variant="outline"
                  className="rounded-[6px] border-[var(--console-line)] text-[var(--console-body)]"
                >
                  {members.length} 位
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div
                  aria-live="polite"
                  aria-busy="true"
                  className="grid gap-4 p-6"
                >
                  <Skeleton className="h-10 rounded-[6px]" />
                  <Skeleton className="h-10 rounded-[6px]" />
                  <Skeleton className="h-10 rounded-[6px]" />
                </div>
              ) : (
                <Table className="min-w-[680px] text-sm">
                  <TableCaption className="sr-only">
                    组织成员和访问角色
                  </TableCaption>
                  <TableHeader className="text-[var(--console-body)]">
                    <TableRow className="border-[var(--console-line)] hover:bg-transparent">
                      <TableHead className="px-4 font-medium">成员</TableHead>
                      <TableHead className="px-4 font-medium">邮箱</TableHead>
                      <TableHead className="px-4 font-medium">角色</TableHead>
                      <TableHead className="px-4 font-medium">
                        加入时间
                      </TableHead>
                      {currentUserIsAdmin && (
                        <TableHead className="px-4 font-medium">操作</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow
                        className="border-[var(--console-line)] hover:bg-[var(--console-canvas)]"
                        key={member.membershipId}
                      >
                        <TableCell className="px-4 py-4 font-medium text-[var(--console-ink)]">
                          {member.name}
                          {member.userId === user?.id && (
                            <Badge
                              variant="secondary"
                              className="ml-2 rounded-[6px] bg-[var(--console-soft)] px-1.5 font-normal text-[var(--console-body)]"
                            >
                              你
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-[var(--console-body)]">
                          {member.email}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className="rounded-[6px] border-[var(--console-line)] text-[var(--console-body)]"
                          >
                            {member.role === 'admin' ? '管理员' : '成员'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-[var(--console-mute)]">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </TableCell>
                        {currentUserIsAdmin && (
                          <TableCell className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button
                                className="h-11 min-w-11 rounded-[6px] px-2 text-xs text-[var(--console-body)] hover:bg-[var(--console-soft)] hover:text-[var(--console-ink)]"
                                disabled={Boolean(busyId)}
                                onClick={() => void changeRole(member)}
                                type="button"
                                variant="ghost"
                              >
                                {busyId === member.membershipId
                                  ? '处理中…'
                                  : member.role === 'admin'
                                    ? '降为成员'
                                    : '设为管理员'}
                              </Button>
                              <Button
                                className="h-11 min-w-11 rounded-[6px] px-2 text-xs text-[var(--console-error-deep)] hover:bg-[var(--console-soft)] hover:text-[var(--console-error)]"
                                disabled={Boolean(busyId)}
                                onClick={() => void remove(member)}
                                type="button"
                                variant="ghost"
                              >
                                移除
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {members.length === 0 && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          className="h-28 text-center text-[var(--console-mute)]"
                          colSpan={currentUserIsAdmin ? 5 : 4}
                        >
                          当前组织还没有其他成员。
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <OrganizationConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={
          pendingAction?.type === 'role' ? '更改成员角色？' : '移除组织成员？'
        }
        description={
          pendingAction?.type === 'role'
            ? `将 ${pendingAction.member.name} 的角色更改为${pendingAction.role === 'admin' ? '管理员' : '成员'}。`
            : `确定从当前组织中移除 ${pendingAction?.member.name ?? '该成员'}？`
        }
        confirmLabel={pendingAction?.type === 'role' ? '确认更改' : '移除成员'}
        destructive={pendingAction?.type === 'remove'}
        onConfirm={() => void confirmAction()}
      />
    </>
  );
}

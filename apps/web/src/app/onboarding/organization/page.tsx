'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@ibase/ui/components/ui/button';
import { Input } from '@ibase/ui/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ibase/ui/components/ui/card';
import { toast } from '@ibase/ui/components/ui/sonner';
import { ApiRequestError } from '../../../features/auth/api/auth-api';
import { organizationsApi } from '../../../features/organizations/api/organizations-api';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.length > 80) {
      setError('组织名称必填，且不能超过 80 个字符。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const organization = await organizationsApi.create(normalizedName);
      toast.success('组织已创建');
      router.replace(`/orgs/${organization.id}/dashboard`);
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError &&
          cause.code === 'EMAIL_VERIFICATION_REQUIRED'
          ? '请先完成邮箱验证，再创建组织。'
          : '组织创建失败，请稍后重试。',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 text-[var(--console-ink)]">
      <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--console-mute)]">
        开始使用 ibase
      </p>
      <h1 className="mt-3 text-[32px] font-semibold leading-10 tracking-[-1.28px]">
        创建一个组织
      </h1>
      <p className="mt-3 max-w-xl text-base leading-6 text-[var(--console-body)]">
        组织用于管理团队成员和项目访问。创建后，你会成为该组织的管理员。
      </p>
      <Card className="mt-8 max-w-xl rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-[20px] font-semibold leading-7 tracking-[-0.4px]">
            组织信息
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <form className="space-y-4" onSubmit={submit}>
            <label
              className="block space-y-2 text-sm font-medium"
              htmlFor="organization-name"
            >
              组织名称
              <Input
                autoComplete="organization"
                className="h-10 rounded-[6px] border-[var(--console-line)] bg-white"
                id="organization-name"
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
              <span className="block text-xs font-normal text-[var(--console-mute)]">
                最多 80 个字符
              </span>
            </label>
            {error && (
              <p className="text-sm text-[#c50000]" role="alert">
                {error}
              </p>
            )}
            <Button
              className="h-10 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-white"
              disabled={busy}
              type="submit"
            >
              {busy ? '创建中…' : '创建组织'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

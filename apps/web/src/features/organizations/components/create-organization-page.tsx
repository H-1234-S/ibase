'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@ibase/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ibase/ui/components/ui/card';
import { Field, FieldError, FieldLabel } from '@ibase/ui/components/ui/field';
import { Input } from '@ibase/ui/components/ui/input';
import { toast } from '@ibase/ui/components/ui/sonner';
import { ApiRequestError } from '../../auth/api/auth-api';
import { organizationsApi } from '../api/organizations-api';

/** Creates an organization and routes its owner to the new workspace. */
export function CreateOrganizationPage() {
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
    <main className="min-h-screen bg-[var(--console-canvas)] px-6 py-16 text-[var(--console-ink)] sm:py-24">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--console-ink)] no-underline"
          href="/dashboard"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-[6px] bg-[var(--console-ink)] text-white"
          >
            i
          </span>
          ibase
        </Link>

        <section className="mt-16 max-w-2xl sm:mt-16">
          <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--console-mute)]">
            开始使用 ibase
          </p>
          <h1 className="mt-3 text-[32px] font-semibold leading-10 tracking-[-1.28px]">
            创建一个组织
          </h1>
          <p className="mt-3 text-base leading-6 text-[var(--console-body)]">
            组织用于管理团队成员和项目访问。创建后，你会成为该组织的管理员。
          </p>

          <Card className="mt-8 rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-[20px] font-semibold leading-7 tracking-[-0.4px]">
                组织信息
              </CardTitle>
              <CardDescription className="text-sm leading-5 text-[var(--console-body)]">
                你之后可以邀请成员加入。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <form className="grid gap-4" onSubmit={submit}>
                <Field>
                  <FieldLabel htmlFor="organization-name">组织名称</FieldLabel>
                  <Input
                    autoComplete="organization"
                    className="h-10 rounded-[6px] border-[var(--console-line)] bg-white px-3 text-sm focus-visible:ring-[var(--console-blue)]"
                    id="organization-name"
                    maxLength={80}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError('');
                    }}
                    value={name}
                  />
                  <p className="text-xs leading-4 text-[var(--console-mute)]">
                    最多 80 个字符
                  </p>
                  <FieldError errors={error ? [error] : []} />
                </Field>
                <Button
                  className="h-11 w-fit rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? '创建中…' : '创建组织'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

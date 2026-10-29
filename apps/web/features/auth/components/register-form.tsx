'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@ibase/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ibase/ui/components/ui/card';
import { ApiRequestError, authRequest } from '../api/auth-api';
import { broadcastAuthChange } from './broadcast-auth-change';
import { useAuth } from '../hooks/use-auth';
import type { PublicUser } from '@ibase/shared-types';

/** Email-code registration page. */
export function RegisterForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  async function sendCode() {
    setSending(true);
    setMessage('');
    try {
      const result = await authRequest<{
        sent: boolean;
        retryAfter: number;
      }>('/api/auth/email/send-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setCountdown(result.retryAfter);
      setMessage('如果该邮箱可以注册，验证码邮件将很快送达。');
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError && error.code === 'RATE_LIMITED'
          ? '请求过于频繁，请稍后再试。'
          : '验证码发送失败，请稍后重试。',
      );
    } finally {
      setSending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const result = await authRequest<{ user: PublicUser }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ name, email, password, code }),
        },
      );
      setUser(result.user);
      broadcastAuthChange();
      router.replace('/');
    } catch (error) {
      const code = error instanceof ApiRequestError ? error.code : '';
      setMessage(
        code === 'EMAIL_ALREADY_REGISTERED'
          ? '该邮箱已注册，请直接登录。'
          : code === 'INVALID_OR_EXPIRED_CODE'
            ? '验证码错误或已过期，请重新获取。'
            : code === 'RATE_LIMITED'
              ? '请求过于频繁，请稍后再试。'
              : '注册失败，请检查信息后重试。',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>创建 ibase 账号</CardTitle>
          <CardDescription>验证邮箱后即可开始使用。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <label className="block space-y-2 text-sm font-medium">
              用户名
              <input
                autoComplete="name"
                className="h-10 w-full rounded-md border bg-background px-3 font-normal"
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              邮箱
              <input
                autoComplete="email"
                className="h-10 w-full rounded-md border bg-background px-3 font-normal"
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              密码
              <input
                autoComplete="new-password"
                className="h-10 w-full rounded-md border bg-background px-3 font-normal"
                maxLength={128}
                minLength={12}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              <span className="block text-xs text-muted-foreground">
                密码长度为 12–128 个字符。
              </span>
            </label>
            <div className="space-y-2">
              <label
                className="block space-y-2 text-sm font-medium"
                htmlFor="email-code"
              >
                邮箱验证码
              </label>
              <div className="flex gap-2">
                <input
                  autoComplete="one-time-code"
                  className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 font-normal"
                  id="email-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setCode(event.target.value)}
                  pattern="[0-9]{6}"
                  required
                  value={code}
                />
                <Button
                  disabled={sending || countdown > 0 || !email}
                  onClick={() => void sendCode()}
                  type="button"
                  variant="outline"
                >
                  {sending
                    ? '发送中…'
                    : countdown > 0
                      ? `${countdown}s 后重发`
                      : '获取验证码'}
                </Button>
              </div>
            </div>
            {message && (
              <p className="text-sm text-muted-foreground" role="status">
                {message}{' '}
                {message.includes('已注册') && (
                  <Link className="text-primary underline" href="/login">
                    前往登录
                  </Link>
                )}
              </p>
            )}
            <Button className="w-full" disabled={busy} type="submit">
              {busy ? '注册中…' : '注册并登录'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            已有账号？{' '}
            <Link className="text-primary underline" href="/login">
              登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

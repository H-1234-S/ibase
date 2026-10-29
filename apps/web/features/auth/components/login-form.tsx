'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
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

/** Email and password login page. */
export function LoginForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setPasswordError('');
    setMessage('');

    try {
      const result = await authRequest<{ user: PublicUser }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
      );
      setUser(result.user);
      broadcastAuthChange();
      router.replace('/');
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.code === 'EMAIL_NOT_REGISTERED'
      ) {
        setMessage('该邮箱尚未注册');
        window.alert('该邮箱尚未注册');
      } else if (
        error instanceof ApiRequestError &&
        error.code === 'INVALID_PASSWORD'
      ) {
        setPasswordError('密码不正确');
      } else {
        setMessage('登录失败，请稍后重试');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录 ibase</CardTitle>
          <CardDescription>使用邮箱和密码登录你的账号。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
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
                autoComplete="current-password"
                className="h-10 w-full rounded-md border bg-background px-3 font-normal"
                maxLength={128}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              {passwordError && (
                <span className="block text-sm text-destructive" role="alert">
                  {passwordError}
                </span>
              )}
            </label>
            {message && (
              <div className="space-y-2 text-sm text-destructive" role="alert">
                <p>{message}</p>
                {message === '该邮箱尚未注册' && (
                  <Link className="text-primary underline" href="/register">
                    前往注册
                  </Link>
                )}
              </div>
            )}
            <Button className="w-full" disabled={busy} type="submit">
              {busy ? '登录中…' : '登录'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            还没有账号？{' '}
            <Link className="text-primary underline" href="/register">
              注册
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

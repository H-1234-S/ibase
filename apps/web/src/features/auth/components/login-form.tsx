'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@ibase/ui/components/ui/button';
import { toast } from '@ibase/ui/components/ui/sonner';
import { ApiRequestError, authRequest } from '../api/auth-api';
import { getApiErrorMessage } from '../api/auth-error-message';
import { broadcastAuthChange } from './broadcast-auth-change';
import { useAuth } from '../hooks/use-auth';
import type { PublicUser } from '@ibase/shared-types';
import { AuthLayout } from './auth-layout';

/** Email and password login page. */
export function LoginForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setPasswordError('');

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
      const nextPath = new URLSearchParams(window.location.search).get('next');
      router.replace(
        nextPath?.startsWith('/') && !nextPath.startsWith('//')
          ? nextPath
          : '/',
      );
    } catch (error) {
      // Field-level errors stay inline; everything else surfaces as a
      // bottom-right toast so failures are never silent.
      if (
        error instanceof ApiRequestError &&
        error.code === 'EMAIL_NOT_REGISTERED'
      ) {
        toast.error('该邮箱尚未注册', {
          action: {
            label: '前往注册',
            onClick: () => router.push('/register'),
          },
        });
      } else if (
        error instanceof ApiRequestError &&
        error.code === 'INVALID_PASSWORD'
      ) {
        setPasswordError('密码不正确');
      } else {
        toast.error(getApiErrorMessage(error, '登录失败，请稍后重试。'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout mode="login">
      <form className="auth-form auth-form-login" onSubmit={submit}>
        <label className="auth-field-label">
          邮箱
          <input
            autoComplete="email"
            className="auth-input"
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="auth-field-label">
          密码
          <input
            autoComplete="current-password"
            className="auth-input"
            maxLength={128}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {passwordError && (
            <span className="auth-error" role="alert">
              {passwordError}
            </span>
          )}
        </label>
        <Button className="auth-submit" disabled={busy} type="submit">
          {busy ? '登录中…' : '登录'}
        </Button>
      </form>
      <p className="auth-switch-prompt">
        首次使用 ibase？ <Link href="/register">创建免费账号</Link>
      </p>
    </AuthLayout>
  );
}

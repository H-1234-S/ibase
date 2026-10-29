'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@ibase/ui/components/ui/button';
import { useAuth } from '../hooks/use-auth';

/** Shows the restored user profile or links to authentication pages. */
export function AuthStatus() {
  const { user, loading, logout } = useAuth();
  const [error, setError] = useState('');

  if (loading) {
    return <p className="text-sm text-muted-foreground">正在恢复登录状态…</p>;
  }

  if (!user) {
    return (
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/login">登录</Link>
        </Button>
        <Button asChild>
          <Link href="/register">注册</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm">你好，{user.name}</span>
      <Button
        variant="outline"
        onClick={() => {
          setError('');
          void logout().catch(() => setError('退出失败，请稍后重试。'));
        }}
      >
        退出登录
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

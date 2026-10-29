'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@ibase/ui/components/ui/button';
import { Badge } from '@ibase/ui/components/ui/badge';
import { useAuth } from '../hooks/use-auth';

/** Shows the restored user profile or links to authentication pages. */
export function AuthStatus() {
  const { user, loading, logout } = useAuth();
  const [error, setError] = useState('');

  if (loading) {
    return (
      <span aria-live="polite" className="text-xs text-[var(--console-mute)]">
        正在恢复登录状态…
      </span>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          asChild
          className="h-11 rounded-[6px] border-[var(--console-line)] bg-white px-1.5 text-sm text-[var(--console-ink)] hover:bg-[var(--console-soft)]"
          variant="outline"
        >
          <Link href="/login">登录</Link>
        </Button>
        <Button
          asChild
          className="h-11 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
        >
          <Link href="/register">注册</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Badge
        variant="outline"
        className="max-w-48 truncate rounded-[6px] border-[var(--console-line)] px-2 py-1 text-xs font-normal text-[var(--console-body)]"
        title={user.name}
      >
        {user.name}
      </Badge>
      <Button
        className="h-11 rounded-[6px] border-[var(--console-line)] bg-white px-1.5 text-sm text-[var(--console-ink)] hover:bg-[var(--console-soft)]"
        variant="outline"
        onClick={() => {
          setError('');
          void logout().catch(() => setError('退出失败，请稍后重试。'));
        }}
      >
        退出登录
      </Button>
      {error && (
        <span className="text-xs text-[var(--console-error-deep)]" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

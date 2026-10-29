'use client';

import { useEffect, useState } from 'react';
import { ApiRequestError, authRequest } from '../api/auth-api';
import { toast } from '@ibase/ui/components/ui/sonner';

/** Manages the registration email-code request and resend countdown. */
export function useRegistrationCode(getEmail: () => string) {
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  async function sendCode() {
    setSending(true);
    try {
      const result = await authRequest<{
        sent: boolean;
        retryAfter: number;
      }>('/api/auth/email/send-code', {
        method: 'POST',
        body: JSON.stringify({ email: getEmail() }),
      });
      setCountdown(result.retryAfter);
      toast.success('如果该邮箱可以注册，验证码邮件将很快送达。');
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError && error.code === 'RATE_LIMITED'
          ? '请求过于频繁，请稍后再试。'
          : '验证码发送失败，请稍后重试。',
      );
    } finally {
      setSending(false);
    }
  }

  return { countdown, sending, sendCode };
}

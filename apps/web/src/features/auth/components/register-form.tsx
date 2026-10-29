'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import type { PublicUser } from '@ibase/shared-types';
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
import {
  ApiRequestError,
  authRequest,
  getApiErrorMessage,
} from '../api/auth-api';
import { broadcastAuthChange } from './broadcast-auth-change';
import { useAuth } from '../hooks/use-auth';

const initialValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  code: '',
};

/** Email-code registration page. */
export function RegisterForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverErrors, setServerErrors] = useState<
    Partial<Record<keyof typeof initialValues, string>>
  >({});

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      setBusy(true);
      setServerErrors({});
      try {
        const result = await authRequest<{ user: PublicUser }>(
          '/api/auth/register',
          {
            method: 'POST',
            body: JSON.stringify({
              name: value.name,
              email: value.email,
              password: value.password,
              code: value.code,
            }),
          },
        );
        setUser(result.user);
        broadcastAuthChange();
        router.replace('/dashboard');
      } catch (error) {
        if (
          error instanceof ApiRequestError &&
          error.code === 'EMAIL_ALREADY_REGISTERED'
        ) {
          setServerErrors({ email: '该邮箱已注册，请直接登录。' });
        } else if (
          error instanceof ApiRequestError &&
          error.code === 'INVALID_OR_EXPIRED_CODE'
        ) {
          setServerErrors({ code: '验证码错误或已过期，请重新获取。' });
        } else if (
          error instanceof ApiRequestError &&
          error.code === 'VALIDATION_ERROR' &&
          error.validationErrors?.length
        ) {
          setServerErrors(
            Object.fromEntries(
              error.validationErrors.map(({ field, rule }) => [
                field,
                field === 'password' && rule === 'minLength'
                  ? '密码至少需要 8 个字符。'
                  : field === 'password' && rule === 'maxLength'
                    ? '密码不能超过 20 个字符。'
                    : field === 'name' && rule === 'maxLength'
                      ? '用户名不能超过 80 个字符。'
                      : field === 'email' && rule === 'isEmail'
                        ? '请输入有效的邮箱地址。'
                        : field === 'code' && rule === 'matches'
                          ? '邮箱验证码必须是 6 位数字。'
                          : '请检查该字段的输入内容。',
              ]),
            ),
          );
        } else {
          toast.error(getApiErrorMessage(error, '注册失败，请稍后重试。'));
        }
      } finally {
        setBusy(false);
      }
    },
  });

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
        body: JSON.stringify({ email: form.getFieldValue('email') }),
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>创建 ibase 账号</CardTitle>
          <CardDescription>验证邮箱后即可开始使用。</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field
              name="name"
              validators={{
                onBlur: ({ value }) =>
                  !value.trim()
                    ? '请输入用户名。'
                    : value.length > 80
                      ? '用户名不能超过 80 个字符。'
                      : undefined,
                onSubmit: ({ value }) =>
                  !value.trim()
                    ? '请输入用户名。'
                    : value.length > 80
                      ? '用户名不能超过 80 个字符。'
                      : undefined,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>用户名</FieldLabel>
                  <Input
                    autoComplete="name"
                    id={field.name}
                    maxLength={80}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                      setServerErrors((current) => ({
                        ...current,
                        name: undefined,
                      }));
                    }}
                    value={field.state.value}
                    aria-invalid={Boolean(
                      field.state.meta.errors.length || serverErrors.name,
                    )}
                  />
                  <FieldError
                    errors={[
                      ...field.state.meta.errors.map(String),
                      ...(serverErrors.name ? [serverErrors.name] : []),
                    ]}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field
              name="email"
              validators={{
                onBlur: ({ value }) =>
                  !value.trim()
                    ? '请输入邮箱地址。'
                    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                      ? '请输入有效的邮箱地址。'
                      : undefined,
                onSubmit: ({ value }) =>
                  !value.trim()
                    ? '请输入邮箱地址。'
                    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                      ? '请输入有效的邮箱地址。'
                      : undefined,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>邮箱</FieldLabel>
                  <Input
                    autoComplete="email"
                    id={field.name}
                    maxLength={254}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                      setServerErrors((current) => ({
                        ...current,
                        email: undefined,
                      }));
                    }}
                    type="email"
                    value={field.state.value}
                    aria-invalid={Boolean(
                      field.state.meta.errors.length || serverErrors.email,
                    )}
                  />
                  <FieldError
                    errors={[
                      ...field.state.meta.errors.map(String),
                      ...(serverErrors.email ? [serverErrors.email] : []),
                    ]}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onBlur: ({ value }) =>
                  value.length < 8
                    ? '密码至少需要 8 个字符。'
                    : value.length > 20
                      ? '密码不能超过 20 个字符。'
                      : undefined,
                onSubmit: ({ value }) =>
                  value.length < 8
                    ? '密码至少需要 8 个字符。'
                    : value.length > 20
                      ? '密码不能超过 20 个字符。'
                      : undefined,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>密码</FieldLabel>
                  <Input
                    autoComplete="new-password"
                    id={field.name}
                    maxLength={20}
                    minLength={8}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                      setServerErrors((current) => ({
                        ...current,
                        password: undefined,
                      }));
                    }}
                    type="password"
                    value={field.state.value}
                    aria-invalid={Boolean(
                      field.state.meta.errors.length || serverErrors.password,
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    密码长度为 8–20 个字符。
                  </p>
                  <FieldError
                    errors={[
                      ...field.state.meta.errors.map(String),
                      ...(serverErrors.password ? [serverErrors.password] : []),
                    ]}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ['password'],
                onBlur: ({ value }) =>
                  !value
                    ? '请再次输入密码。'
                    : value !== form.getFieldValue('password')
                      ? '两次输入的密码不一致。'
                      : undefined,
                onSubmit: ({ value }) =>
                  !value
                    ? '请再次输入密码。'
                    : value !== form.getFieldValue('password')
                      ? '两次输入的密码不一致。'
                      : undefined,
                onChange: ({ value }) =>
                  value && value !== form.getFieldValue('password')
                    ? '两次输入的密码不一致。'
                    : undefined,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>确认密码</FieldLabel>
                  <Input
                    autoComplete="new-password"
                    id={field.name}
                    maxLength={20}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    type="password"
                    value={field.state.value}
                    aria-invalid={Boolean(field.state.meta.errors.length)}
                  />
                  <FieldError errors={field.state.meta.errors.map(String)} />
                </Field>
              )}
            </form.Field>

            <form.Field
              name="code"
              validators={{
                onBlur: ({ value }) =>
                  /^\d{6}$/.test(value)
                    ? undefined
                    : value
                      ? '邮箱验证码必须是 6 位数字。'
                      : '请输入邮箱验证码。',
                onSubmit: ({ value }) =>
                  /^\d{6}$/.test(value)
                    ? undefined
                    : value
                      ? '邮箱验证码必须是 6 位数字。'
                      : '请输入邮箱验证码。',
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>邮箱验证码</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      autoComplete="one-time-code"
                      className="min-w-0 flex-1"
                      id={field.name}
                      inputMode="numeric"
                      maxLength={6}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        setServerErrors((current) => ({
                          ...current,
                          code: undefined,
                        }));
                      }}
                      value={field.state.value}
                      aria-invalid={Boolean(
                        field.state.meta.errors.length || serverErrors.code,
                      )}
                    />
                    <form.Subscribe selector={(state) => state.values.email}>
                      {(email) => (
                        <Button
                          disabled={
                            sending ||
                            countdown > 0 ||
                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                          }
                          onClick={() => void sendCode()}
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          {sending
                            ? '发送中…'
                            : countdown > 0
                              ? `${countdown}s 后重发`
                              : '获取验证码'}
                        </Button>
                      )}
                    </form.Subscribe>
                  </div>
                  <FieldError
                    errors={[
                      ...field.state.meta.errors.map(String),
                      ...(serverErrors.code ? [serverErrors.code] : []),
                    ]}
                  />
                </Field>
              )}
            </form.Field>
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

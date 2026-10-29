'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import type { PublicUser } from '@ibase/shared-types';
import { Button } from '@ibase/ui/components/ui/button';
import { Field, FieldError, FieldLabel } from '@ibase/ui/components/ui/field';
import { Input } from '@ibase/ui/components/ui/input';
import { toast } from '@ibase/ui/components/ui/sonner';
import { ApiRequestError, authRequest } from '../api/auth-api';
import { getApiErrorMessage } from '../api/auth-error-message';
import { broadcastAuthChange } from './broadcast-auth-change';
import { useAuth } from '../hooks/use-auth';
import { useRegistrationCode } from '../hooks/use-registration-code';
import { AuthLayout } from './auth-layout';
import { registrationFieldErrors } from '../utils/registration-field-errors';

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
  const [busy, setBusy] = useState(false);
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
        const nextPath = new URLSearchParams(window.location.search).get(
          'next',
        );
        router.replace(
          nextPath?.startsWith('/') && !nextPath.startsWith('//')
            ? nextPath
            : '/dashboard',
        );
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
          error.validationErrors?.length
        ) {
          const fieldErrors = registrationFieldErrors(error);
          if (fieldErrors) setServerErrors(fieldErrors);
        } else {
          toast.error(getApiErrorMessage(error, '注册失败，请稍后重试。'));
        }
      } finally {
        setBusy(false);
      }
    },
  });

  const { countdown, sending, sendCode } = useRegistrationCode(() =>
    form.getFieldValue('email'),
  );

  useEffect(() => {
    const invitedEmail = new URLSearchParams(window.location.search).get(
      'email',
    );
    if (invitedEmail && !form.getFieldValue('email')) {
      form.setFieldValue('email', invitedEmail);
    }
  }, [form]);

  return (
    <AuthLayout mode="register">
      <form
        className="auth-form auth-form-register"
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
              <p className="auth-field-hint">密码长度为 8–20 个字符。</p>
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
              <div className="auth-code-row">
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
                      className="auth-code-button"
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
        <Button className="auth-submit" disabled={busy} type="submit">
          {busy ? '注册中…' : '注册并登录'}
        </Button>
      </form>
      <p className="auth-switch-prompt">
        已有 ibase 账号？ <Link href="/login">直接登录</Link>
      </p>
    </AuthLayout>
  );
}

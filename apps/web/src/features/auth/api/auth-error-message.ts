import { ApiRequestError } from './auth-api';

/** Converts backend validation details into messages a Chinese-language form can show. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiRequestError)) {
    return fallback;
  }

  const knownErrors: Record<string, string> = {
    EMAIL_ALREADY_REGISTERED: '该邮箱已注册，请直接登录。',
    EMAIL_NOT_REGISTERED: '该邮箱尚未注册。',
    INVALID_PASSWORD: '密码不正确。',
    INVALID_OR_EXPIRED_CODE: '验证码错误或已过期，请重新获取。',
    RATE_LIMITED: '请求过于频繁，请稍后再试。',
    UNAUTHENTICATED: '登录状态已失效，请重新登录。',
  };
  if (knownErrors[error.code]) {
    return knownErrors[error.code] ?? fallback;
  }

  if (error.code !== 'VALIDATION_ERROR') {
    return fallback;
  }

  const ruleMessages: Record<string, string> = {
    isEmail: '请输入有效的邮箱地址。',
    minLength: '长度未达到要求。',
    maxLength: '长度超过限制。',
    matches: '格式不正确。',
    isString: '格式不正确。',
    whitelistValidation: '包含不支持的字段。',
  };
  const fieldLabels: Record<string, string> = {
    email: '邮箱',
    name: '用户名',
    password: '密码',
    code: '邮箱验证码',
  };

  const structuredMessages = (error.validationErrors ?? []).map(
    ({ field, rule }) => {
      const label = fieldLabels[field] ?? '提交内容';
      if (field === 'password' && rule === 'minLength') {
        return `${label}至少需要 8 个字符。`;
      }
      if (field === 'password' && rule === 'maxLength') {
        return `${label}不能超过 20 个字符。`;
      }
      if (field === 'code' && rule === 'matches') {
        return `${label}必须是 6 位数字。`;
      }
      return `${label}${ruleMessages[rule] ?? '不符合要求。'}`;
    },
  );
  const legacyMessages = (error.fields ?? []).map((field) => {
    if (/password.*longer than or equal to 8/i.test(field)) {
      return '密码至少需要 8 个字符。';
    }
    if (/password.*shorter than or equal to 20/i.test(field)) {
      return '密码不能超过 20 个字符。';
    }
    if (/email/i.test(field)) {
      return '请输入有效的邮箱地址。';
    }
    if (/name/i.test(field)) {
      return '用户名格式不正确。';
    }
    if (/code/i.test(field)) {
      return '请输入有效的邮箱验证码。';
    }
    return '请检查表单内容后重试。';
  });
  const messages = [...structuredMessages, ...legacyMessages];
  return messages.length ? [...new Set(messages)].join(' ') : fallback;
}

import { ApiRequestError } from '../api/auth-api';

/** Maps registration API validation rules to the corresponding form fields. */
export function registrationFieldErrors(error: ApiRequestError) {
  if (error.code !== 'VALIDATION_ERROR' || !error.validationErrors?.length) {
    return undefined;
  }

  return Object.fromEntries(
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
  );
}

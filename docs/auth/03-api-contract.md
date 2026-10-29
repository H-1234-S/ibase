# Auth API 契约

API 当前全局前缀为 `/api`，所以本模块路径均包含此前缀。所有请求和响应使用 JSON（无响应体的退出/刷新错误除外），所有受保护写请求通过 Cookie 认证并执行 CSRF 校验。成功数据只返回公开用户信息，不返回 Token。

## 公开用户

```json
{
  "id": "<user-id>",
  "name": "Alice",
  "email": "user@example.com",
  "emailVerifiedAt": "2026-10-29T02:00:00.000Z"
}
```

具体 ID 类型服从项目统一策略；时间使用 ISO 8601。不得包含密码摘要、会话信息或内部标记。

## 端点

| 方法与路径                       | 认证                     | 请求                                                                                  | 成功                                                                   |
| -------------------------------- | ------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `POST /api/auth/email/send-code` | 否                       | `{ "email": "user@example.com" }`                                                     | `200 { "data": { "sent": true, "expiresIn": 300, "retryAfter": 60 } }` |
| `POST /api/auth/register`        | 否                       | `{ "name": "Alice", "email": "user@example.com", "password": "…", "code": "123456" }` | `201 { "data": { "user": <PublicUser> } }` + Cookie                    |
| `POST /api/auth/login`           | 否                       | `{ "email": "user@example.com", "password": "…" }`                                    | `200 { "data": { "user": <PublicUser> } }` + Cookie                    |
| `GET /api/auth/me`               | Access Cookie            | 无                                                                                    | `200 { "data": { "user": <PublicUser> } }`                             |
| `POST /api/auth/refresh`         | Refresh Cookie           | 无                                                                                    | `200 { "data": { "user": <PublicUser> } }` + 轮换 Cookie               |
| `POST /api/auth/logout`          | 当前会话（重复调用幂等） | 无                                                                                    | `204`，清除 Cookie                                                     |

`/auth/email/send-code` 对已注册邮箱的行为需审核：为避免账号枚举，推荐统一返回通用成功响应，并不发送验证码；前端可在注册提交时收到 `EMAIL_ALREADY_REGISTERED`。如产品要求发信接口立即提示已注册，则该端点也会暴露枚举信息。

## 错误格式

```json
{
  "error": {
    "code": "INVALID_OR_EXPIRED_CODE",
    "message": "验证码无效或已过期",
    "requestId": "<request-id>"
  }
}
```

`message` 仅供展示/调试，不作为前端分支依据；分支使用 `code`。验证错误可附带经过白名单化的 `fields`。

| 错误码                     | HTTP | 适用场景                                                                             |
| -------------------------- | ---: | ------------------------------------------------------------------------------------ |
| `VALIDATION_ERROR`         |  400 | DTO 或字段验证失败                                                                   |
| `EMAIL_ALREADY_REGISTERED` |  409 | 注册邮箱已存在/唯一索引冲突                                                          |
| `EMAIL_NOT_REGISTERED`     |  404 | 登录邮箱不存在（按产品所需区分）                                                     |
| `INVALID_PASSWORD`         |  401 | 邮箱存在但密码不正确                                                                 |
| `INVALID_OR_EXPIRED_CODE`  |  400 | 验证码错误、过期、已消费或超尝试次数                                                 |
| `RATE_LIMITED`             |  429 | 发送、登录、注册或刷新达到限额；可附 `Retry-After`                                   |
| `ACCESS_TOKEN_EXPIRED`     |  401 | Access Token 已过期；仅此错误允许前端尝试一次 refresh                                |
| `UNAUTHENTICATED`          |  401 | 凭证缺失、签名/声明非法、会话撤销，或 refresh 凭证无效/过期/已轮换；不得自动再次刷新 |
| `FORBIDDEN`                |  403 | CSRF/Origin 不合法或操作禁止                                                         |
| `INTERNAL_SERVER_ERROR`    |  500 | 未预期内部错误，不泄露底层详情                                                       |

状态码和认证错误码应明确区分“Access Token 仅过期”与“凭证缺失/非法/撤销”，也要与 `FORBIDDEN` 权限/CSRF 错误区分。前端仅对受保护业务接口的 `ACCESS_TOKEN_EXPIRED` 执行一次刷新；`UNAUTHENTICATED` 直接清理登录态并要求登录。Refresh 端点的任何 401 都是终止结果，绝不可再次触发 refresh。Guard 必须将过期错误稳定映射为 `ACCESS_TOKEN_EXPIRED`，签名错误、类型不符、撤销等映射为 `UNAUTHENTICATED`。服务端保持项目统一异常响应风格；若项目尚无统一 envelope，按上述格式实现。

## Cookie 契约

登录/注册/刷新通过 `Set-Cookie` 返回 `HttpOnly` 凭证。Access Cookie 名称与 Refresh Cookie 名称实现时固定并文档化；建议使用 `ibase_at` 与 `ibase_rt`。浏览器请求必须携带 credentials。登出和刷新失效时使用完全相同的 Path/属性清除对应 Cookie。响应 JSON 不包含 JWT。

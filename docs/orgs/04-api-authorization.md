# 04 API、授权与安全设计

## 1. API 约定

- 全局前缀 `/api`，成功响应沿用 `{ "data": ... }`。
- 错误沿用统一 `error.code/message/requestId`，校验错误使用 `validationErrors`。
- 写操作复用 Origin + `X-Ibase-Request` CSRF 标记校验；认证复用 JwtAuthGuard。
- organizationId、membershipId、invitationId 使用 UUID；公开邀请预览和接受使用高熵 token，而不是邀请 ID。
- 时间以 ISO 8601 字符串返回；邀请列表不返回 tokenHash 或原始 token。

## 2. 接口清单

| 方法   | 路径                                                         | 认证/权限        | 用途与主要输入                                 |
| ------ | ------------------------------------------------------------ | ---------------- | ---------------------------------------------- |
| POST   | `/api/organizations`                                         | 已验证用户       | `{ name }`，创建组织和 admin Membership        |
| GET    | `/api/organizations`                                         | 已登录           | 返回本人组织及各自角色                         |
| GET    | `/api/organizations/:orgId`                                  | 本组织成员       | 组织详情、成员数、当前角色                     |
| DELETE | `/api/organizations/:orgId`                                  | 本组织 admin     | 删除当前数据库范围内的组织                     |
| GET    | `/api/organizations/:orgId/members`                          | 本组织成员       | 成员、邮箱、角色、加入时间                     |
| PATCH  | `/api/organizations/:orgId/members/:membershipId`            | 本组织 admin     | `{ role: 'admin' \| 'member' }`                |
| DELETE | `/api/organizations/:orgId/members/:membershipId`            | 本组织 admin     | 移除成员，受最后 admin 保护                    |
| POST   | `/api/organizations/:orgId/invitations`                      | 本组织 admin     | `{ email }`；角色固定 member                   |
| GET    | `/api/organizations/:orgId/invitations`                      | 本组织 admin     | 按状态查询邀请，默认 pending                   |
| POST   | `/api/organizations/:orgId/invitations/:invitationId/resend` | 本组织 admin     | 重发有效 pending 邀请                          |
| POST   | `/api/organizations/:orgId/invitations/:invitationId/revoke` | 本组织 admin     | 撤销 pending 邀请                              |
| GET    | `/api/invitations/:token`                                    | 公开、限流       | 安全预览组织名、目标邮箱、角色、状态和过期时间 |
| POST   | `/api/invitations/:token/accept`                             | 已验证用户、限流 | 校验邮箱并原子接受邀请                         |

第一版不提供“提交 orgId 直接加入组织”或“客户端提交 role 创建邀请”的接口。

## 3. 典型响应约束

### 3.1 组织详情

返回 `id/name/createdAt/currentRole/memberCount`，不返回其他组织信息。非成员访问使用与不存在一致的通用响应，减少组织存在性泄露。

### 3.2 成员列表

只返回目标组织成员的公开必要字段：`membershipId/userId/name/email/role/joinedAt`。不返回密码摘要、会话、token、全局用户审计信息。

### 3.3 邀请预览

只返回 `organizationId/organizationName/email/role/status/expiresAt` 及必要的邀请者显示名。不能返回成员列表、tokenHash、内部错误或其他邀请。

### 3.4 接受邀请

返回 `organizationId/membershipId/role/alreadyMember` 等最小结果，供前端进入目标组织；原始 token 不再返回。

## 4. 服务端授权分层

1. **身份层**：JwtAuthGuard 验证 Cookie，加载当前用户；公开邀请预览除外。
2. **组织成员层**：每次查询 `organizationId + userId` 的 Membership，拒绝非成员。
3. **组织角色层**：管理操作再次要求当前 Membership 为 admin。
4. **资源归属层**：membershipId、invitationId 必须与路由 orgId 匹配，避免跨组织 ID 替换。
5. **业务不变量层**：事务内再次检查最后 admin、邀请状态、邮箱匹配、过期时间和唯一约束。

Controller 只做输入和装配不构成完整授权。领域服务的关键写操作必须在业务事务边界内重检权限，防止下游调用绕过 Guard。

## 5. 邀请专项校验

- 邮箱 trim + lowercase + 格式 + 最大长度，与 Auth 规范化一致。
- 创建前检查目标邮箱是否已是本组织成员。
- 创建邀请不读取或信任客户端 role/userId/organizationId/expiresAt/tokenHash。
- 接受邀请只从认证会话取得用户，从 token 对应数据库记录取得组织与角色。
- 当前用户 `emailVerifiedAt` 必须有效，规范化邮箱必须与邀请目标完全一致。
- 状态、过期与消费在数据库事务内校验，以服务端时间为准。
- 已是本组织成员时按幂等规则处理，不重复插入。

## 6. 并发与幂等

| 场景               | 要求                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------ |
| 创建组织           | Organization + 初始 Membership 单事务                                                |
| 重复接受邀请       | tokenHash 唯一、邀请行锁/条件更新、Membership 唯一约束；无副作用的重复请求可幂等返回 |
| 并发接受同一邀请   | 最多一条 Membership、一次 pending → accepted 迁移                                    |
| 并发邀请同一邮箱   | pending 部分唯一索引与冲突处理，不产生多个有效邀请                                   |
| 并发角色变更/移除  | 锁定 Organization 行后重检 admin 数，序列化关键变更                                  |
| 并发删除组织       | Organization 行锁；只有第一个请求执行，其余得到不存在/已删除                         |
| 移除与接受邀请竞争 | 事务提交后由唯一约束和重新授权决定最终一致状态，不出现重复成员或越权缓存             |

前端禁用重复提交不是以上机制的替代品。

## 7. 错误码建议

| 错误码                         |    HTTP | 语义                                 |
| ------------------------------ | ------: | ------------------------------------ |
| `UNAUTHENTICATED`              |     401 | 未登录或会话失效                     |
| `EMAIL_VERIFICATION_REQUIRED`  |     403 | 当前账号尚未完成邮箱验证             |
| `ORGANIZATION_NOT_FOUND`       |     404 | 组织不存在，或对非成员隐藏           |
| `ORG_ADMIN_REQUIRED`           |     403 | 当前成员不是 admin                   |
| `ORGANIZATION_NAME_INVALID`    |     400 | 名称不符合规则                       |
| `MEMBERSHIP_NOT_FOUND`         |     404 | 目标成员不在本组织                   |
| `LAST_ADMIN_REQUIRED`          |     409 | 操作会使组织失去最后 admin           |
| `ALREADY_ORGANIZATION_MEMBER`  |     409 | 创建邀请时目标已是成员               |
| `INVITATION_NOT_FOUND`         |     404 | token 无效或资源不属于本组织         |
| `INVITATION_ALREADY_PENDING`   |     409 | 同组织同邮箱已有有效邀请，可执行重发 |
| `INVITATION_EXPIRED`           |     410 | 邀请已过期，可重新邀请               |
| `INVITATION_REVOKED`           |     410 | 邀请已撤销                           |
| `INVITATION_ALREADY_ACCEPTED`  |     409 | 邀请已被使用                         |
| `INVITATION_EMAIL_MISMATCH`    |     403 | 当前账号邮箱与邀请不匹配             |
| `INVITATION_EMAIL_SEND_FAILED` | 502/503 | 邮件未成功投递，可按规则重试         |
| `RATE_LIMITED`                 |     429 | 触发限流，遵循 Retry-After           |

内部 SMTP、SQL 和堆栈不得进入客户端响应；requestId 用于关联服务端日志。

## 8. 限流与滥用防护

复用 Redis 原子计数模式，至少覆盖：

- 按组织 admin、目标邮箱和 IP 限制邀请创建/重发；建议初始值为每组织 20 封/小时、同邮箱 5 封/小时，并设置重发冷却。
- 按 IP 限制邀请预览，按 IP + 用户限制接受，防止令牌枚举和暴力请求。
- 邮件发送与 token 校验失败不自动紧密重试；429 返回 Retry-After。
- 所有限流键使用不可逆派生值，不在 Redis key 中保存明文邮箱或 token。

具体阈值为可配置初始默认值，需通过本地测试确定，不得将限流当作邮件一致性的保证。

## 9. 审计与日志

- 记录组织创建、邀请创建/重发/撤销/接受、角色变更、成员移除、组织删除。
- 数据字段至少包含 actorUserId、organizationId、action、targetId、requestId、服务端时间。
- 不记录原始邀请 token、tokenHash、Auth token、邮箱验证码、密码或 SMTP 凭证。
- 邮箱等个人信息在普通应用日志中最小化或散列；业务审计表仅保留必要字段。
- 角色和成员操作的关键记录应在同一事务内写入，避免业务成功但审计必然缺失。

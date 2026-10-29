# 组织管理与成员邀请 PRD

## 文档状态

- 状态：待评审，尚未进入业务代码实现。
- 适用版本：组织与成员第一版。
- 依赖能力：现有 Auth 注册、登录、邮箱验证码、会话与统一错误响应。
- 编写依据：当前仓库实际代码及已确认的产品决策；文中“应”“必须”均为后续实现要求，不代表现有能力。

## 文档导航

1. [产品需求与范围](./01-requirements.md)：背景、目标、角色、范围、业务流程与产品验收标准。
2. [领域模型与业务规则](./02-domain-model.md)：组织、成员、角色、项目归属、组织上下文与关键不变量。
3. [前端页面与用户流程](./03-frontend-flows.md)：路由、创建组织、Dashboard、组织切换、邀请接受及异常状态。
4. [API、授权与安全设计](./04-api-authorization.md)：接口清单、权限矩阵、错误码、并发、限流与审计。
5. [邀请、邮件与 Auth 恢复流程](./05-invitations-email.md)：邀请状态机、令牌、邮件失败补偿、注册/登录恢复。
6. [数据模型、迁移与组织删除](./06-data-migration-deletion.md)：表结构、约束、事务、迁移及删除边界。
7. [测试计划与验收清单](./07-testing-acceptance.md)：单元、集成、并发、前端与回归测试。
8. [架构复用与实施计划](./08-implementation-plan.md)：现有模块复用、阶段安排、文件清单、配置及交付边界。

## 已确认的核心产品决策

1. **项目直接归属于 Organization。** Membership 只授予组织级访问资格，项目仍需叠加项目级权限；成员身份不得绕过项目授权。
2. **邀请注册复用 Auth 邮箱验证。** 未注册用户必须完成现有邮箱验证码注册流程，邀请链接本身不能证明邮箱归属。
3. **组织 ID 可以进入路由和客户端上下文，但不是授权凭证。** 每次组织 API 访问都重新查询 Membership；角色不写入长期 JWT。
4. **允许同一组织存在多个 admin。** 创建者只是初始 admin，`createdBy` 仅用于审计，不代表永久 owner 或唯一管理者。
5. **任何组织始终至少有一名 admin。** 降级、移除及并发操作均不能破坏该约束。
6. **邀请角色第一版固定为 member。** admin 只能通过受控的成员角色修改流程授予。

## 当前仓库基线

- `apps/api`：NestJS 12，全局 `/api` 前缀、class-validator DTO 校验、统一错误信封；Auth 使用 HttpOnly Cookie、Access/Refresh Token、Origin/CSRF 标记校验。
- 数据层：PostgreSQL 17 + Drizzle ORM + Drizzle Kit 迁移；已有 `users`、`auth_sessions`、`auth_refresh_tokens`，没有组织、成员、邀请或项目表。
- Redis：已用于 Auth 验证码、限流及并发控制，可复用其原子限流模式。
- 邮件：`EmailService` 已使用 Nodemailer + QQ SMTP，可扩展邀请邮件；注册邮箱验证码由 Redis 管理。
- `apps/web`：Next.js 16 App Router + React 19，源码位于 `src/`；已有登录、注册、AuthProvider、统一 `authRequest` 自动刷新和 sonner toast。
- 前端现状：`/dashboard` 为占位页；没有组织上下文、成员页面或邀请恢复流程。
- 共享 UI：`@ibase/ui` 当前有 Button、Card、Sonner；弹窗、表格、选择器等按 shadcn 风格按需补齐，不引入另一套设计系统。
- 测试：API 使用 Vitest，区分 `tests/` 单元测试与 `test/` e2e；Web 当前只有 lint、类型检查和构建脚本。

## 第一版边界

第一版交付可靠的数据库内组织、成员和邀请能力，不包含项目 CRUD、外部云资源清理、SSO、Billing、自定义角色、批量邀请或组织所有权转让。当前没有 Project 表，因此不得宣称组织删除已清理项目或外部资源；项目接入时必须遵守本 PRD 的组织归属和删除扩展约束。

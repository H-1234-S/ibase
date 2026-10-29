# 08 架构复用与实施计划

## 1. 现有架构分析与复用

| 现有能力           | 实际位置                                            | 复用方式                                                                                |
| ------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Monorepo           | `apps/api`、`apps/web`、`packages/*` + pnpm/Turbo   | API、Web、共享类型和 UI 分边界扩展，不新增平行应用                                      |
| Auth 身份认证      | `apps/api/src/auth/`                                | 复用注册、邮箱验证码、登录、会话、JwtAuthGuard、CurrentUser                             |
| 写请求 Origin/CSRF | `auth-origin.guard.ts` + `X-Ibase-Request`          | 组织写接口使用同等保护，可提炼通用 Guard 但不改变 Auth 行为                             |
| 数据库             | `DatabaseService` + Drizzle Schema/迁移             | 扩展 Schema 和事务，复用连接池，不新增 ORM                                              |
| Redis              | `RedisService` + AuthSecurityService 原子脚本模式   | 新增邀请/令牌限流键和原子计数，不复用 Auth 验证码作为邀请 token                         |
| 邮件               | `auth/services/email.service.ts`                    | 扩展 `sendOrganizationInvitation`，复用 transporter、from 和超时配置                    |
| 错误契约           | `packages/shared-types/src/api.ts` + 全局异常过滤器 | 复用错误信封和 validationErrors，新增组织稳定错误码                                     |
| Web 请求           | `apps/web/src/features/auth/api/auth-api.ts`        | 复用 credentials、CSRF 头、Access 过期单飞刷新；业务 API 可提炼共享客户端但避免重复封装 |
| Auth 状态          | AuthProvider、BroadcastChannel、`/api/auth/me`      | 保持唯一用户状态源，组织上下文在其上扩展                                                |
| UI/反馈            | `@ibase/ui` Button/Card/Sonner                      | 新增 shadcn 风格 Dialog/Table/Select 等，使用右下角 toast                               |
| 共享公开类型       | `@ibase/shared-types`                               | 增加 Organization/Member/Invitation DTO 类型，禁止本地重复定义替代                      |
| 测试与质量         | API Vitest、e2e、oxlint/tsc；Web ESLint/tsc/build   | 按现有命令补充组织测试；前端自动化不足需显式补齐                                        |

`packages/validators`、`packages/sdk` 当前没有可确认的组织实现，PRD 不假设其已有能力。现有 `/dashboard` 仅为占位页，不能视为已有组织 Dashboard。

## 2. 实施阶段与依赖

### 阶段一：需求确认与数据基础

- 评审本 PRD，冻结角色、状态机、错误码、删除边界。
- 新增 Organization/Membership/Invitation/Audit Schema 与迁移。
- 空库及 Auth 数据库验证迁移、外键、索引、唯一约束。
- 先写唯一约束和创建组织失败测试。

出口：迁移可执行，Auth 数据不受影响。

### 阶段二：组织、成员与授权基础

- 实现组织创建、列表、详情、成员查询。
- 实现成员/admin Guard 或领域授权服务及事务内重检。
- 实现组织级错误码和共享类型。
- 完成非成员、member 越权及重复 Membership 测试。

出口：组织与初始 admin 一致，数据隔离生效。

### 阶段三：组织前端与上下文

- 实现创建组织页、组织布局、Dashboard、成员列表和组织切换。
- 改造 `/dashboard` 兼容入口及登录/注册后的默认路由决策。
- 接入加载、空、错误、toast 和刷新恢复。

出口：普通注册 → 创建组织 → Dashboard 全流程可用。

### 阶段四：邀请、邮件与状态管理

- 实现 token/HMAC、邀请创建、列表、重发、撤销、过期重邀。
- 扩展 EmailService、Redis 限流、首次发送失败补偿。
- 实现邀请管理 UI 和公开预览。
- 完成邮件失败、重复邀请和状态机测试。

出口：admin 能可靠管理邀请，邮件失败无可恢复性缺口。

### 阶段五：邀请接受与 Auth 恢复

- 实现公开预览和认证接受接口、事务及并发保护。
- 改造 proxy、登录、注册以保留受控邀请上下文。
- 复用现有邮箱验证码完成未注册用户邀请注册。
- 实现邮箱不匹配、切换账号、失效提示和 token 清理。

出口：已注册/未注册两条邀请路径均通过，普通 Auth 无回归。

### 阶段六：角色、移除与组织删除

- 实现角色修改、移除成员、最后 admin 事务保护。
- 实现数据库内组织删除和最小审计。
- 完成确认 Dialog、失效上下文清理和并发测试。

出口：最后 admin 不变量和数据库删除范围可靠。

### 阶段七：安全、测试与交付审查

- 补齐限流、审计、敏感信息检查、前端行为测试。
- 执行全部单测/e2e、迁移、lint、类型、构建和 Auth 回归。
- 对照实际结果编写开发总结，明确未完成边界。

## 3. 预计新增或修改的文件

以下为规划而非已创建文件；实现时可按模块边界细分，单源文件原则上保持 500 行以内。

### 3.1 API

- `apps/api/src/database/schemas/organizations.ts`：组织表。
- `apps/api/src/database/schemas/memberships.ts`：成员关系、角色和唯一约束。
- `apps/api/src/database/schemas/organization-invitations.ts`：邀请与状态。
- `apps/api/src/database/schemas/organization-audit-logs.ts`：最小审计。
- `apps/api/src/database/schemas/index.ts`：导出新增 Schema。
- `apps/api/drizzle/*`：Drizzle 生成并人工审查的迁移与快照。
- `apps/api/src/organizations/organizations.module.ts`：组织模块装配。
- `apps/api/src/organizations/controllers/*`：组织、成员、邀请管理 Controller。
- `apps/api/src/organizations/services/*`：组织、成员、邀请、授权和审计事务。
- `apps/api/src/organizations/guards/*`、`decorators/*`：成员/admin 授权上下文。
- `apps/api/src/organizations/dto/*`：名称、邮箱、角色和 UUID 输入。
- `apps/api/src/organizations/errors/*`：稳定业务错误码。
- `apps/api/src/invitations/*`：如独立公开预览/接受边界更清晰，可单独模块；否则归入 organizations，避免无意义重复封装。
- `apps/api/src/auth/services/email.service.ts`：新增邀请邮件方法，不改注册验证码语义。
- `apps/api/src/config/env.validation.ts`：邀请密钥、TTL 和限流配置校验。
- `apps/api/src/app.module.ts`：注册组织模块。
- `apps/api/tests/organizations/**`、`apps/api/test/organizations.e2e-spec.ts`：镜像单测与流程/并发测试。

### 3.2 Shared Types

- `packages/shared-types/src/organization.ts`：公开组织、成员、邀请和角色契约。
- `packages/shared-types/src/api.ts`：仅在通用错误契约确需扩展时修改。
- `packages/shared-types/src/index.ts`：统一导出。

### 3.3 Web

- `apps/web/src/app/onboarding/organization/page.tsx`：创建组织。
- `apps/web/src/app/orgs/[orgId]/*`：组织布局、Dashboard、成员、邀请、设置。
- `apps/web/src/app/invitations/[token]/page.tsx`：预览与接受。
- `apps/web/src/features/organizations/api/*`：组织请求与错误映射。
- `apps/web/src/features/organizations/components/*`：切换、成员、邀请和删除交互。
- `apps/web/src/features/organizations/context/*`、`hooks/*`：非授权性的当前组织显示上下文。
- `apps/web/src/features/invitations/*`：邀请恢复和接受流程。
- `apps/web/src/features/auth/components/login-form.tsx`、`register-form.tsx`：认证后的邀请恢复路由。
- `apps/web/src/features/auth/api/auth-api.ts`：仅在通用请求/错误解析确需扩展时修改。
- `apps/web/src/proxy.ts`：公开邀请路由、Auth 页面及受控 next 处理。
- `apps/web/src/app/dashboard/page.tsx`：兼容重定向或组织 Dashboard 入口。

### 3.4 UI 与配置

- `packages/ui/src/components/ui/dialog.tsx`、`table.tsx`、`select.tsx` 等：按实际页面需要新增，不一次性堆无用组件。
- `.env.example`：只新增无秘密示例键，不写真实凭证。
- `apps/web/package.json`：如落实前端组件/e2e 自动化，再增加最小测试依赖和脚本。

## 4. 环境变量与人工配置

复用现有：

- `DATABASE_URL`、`REDIS_URL`。
- `WEB_ORIGIN`：邀请链接应用 Origin，禁止硬编码生产域名。
- `EMAIL_USER`、`EMAIL_PASSWORD`、`EMAIL_FROM`。
- Auth JWT/Cookie/验证码和限流配置。

新增或明确：

- `INVITATION_TOKEN_SECRET`：独立高熵密钥，用于 token 摘要。
- `INVITATION_TTL_HOURS=168`。
- 邀请创建/重发/预览/接受的限流阈值与冷却配置。

生产部署需人工配置真实密钥和 SMTP 授权码；任何环境不得把真实值写入 PRD、测试快照或版本控制。

## 5. 本地邮件测试方法

1. 启动 PostgreSQL/Redis，执行迁移。
2. 使用可控 SMTP 或邮件捕获服务配置现有 EMAIL 变量。
3. 创建两个用户/组织，分别验证已注册和未注册邀请。
4. 通过邮件替身模拟首次发送失败、重发失败、超时和限流。
5. 检查数据库 pending/accepted/revoked/expired 与补偿结果，并确认日志无 token/验证码/密钥。
6. 自动化测试不依赖真实 QQ SMTP；真实 SMTP 只做人工联调。

## 6. 最终交付清单

实现完成后总结必须基于实际代码和测试输出，包含：

1. 已实现流程和明确未实现项。
2. 核心文件、模块和共享类型。
3. 迁移文件、表/索引/约束及实际执行结果。
4. API 清单、权限矩阵和错误码。
5. 邮件配置、本地捕获方法与失败补偿验证。
6. 组织删除真实范围及外部资源边界。
7. 单元、集成、并发、前端与 Auth 回归结果。
8. 类型、lint、构建命令的实际结果。
9. 需人工配置的环境变量。
10. 已知限制、后续项目归属/外部清理升级建议和未解决风险。

## 7. 当前明确的设计决策与后续事项

已决定：无永久 owner、邀请固定 member、7 天有效、有效 pending 不重复创建、重发不延长有效期、过期重邀生成新 token、当前数据库内硬删除、邀请注册复用 Auth 邮箱验证。

后续接入项目或外部资源时必须重新评审：项目级权限与 org admin 的关系、外部资源两阶段删除、全局用户删除对 createdBy/invitedBy/审计的影响。这些不得以默认假设悄然实现。

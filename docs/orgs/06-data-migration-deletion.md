# 06 数据模型、迁移与组织删除

## 1. 数据层约束

- 使用现有 Drizzle ORM、PostgreSQL 和 Drizzle Kit，不引入第二套 ORM。
- Schema 位于 `apps/api/src/database/schemas/`，迁移由 `apps/api/drizzle/` 管理。
- 时间统一 `timestamp with time zone`，由数据库或服务端生成。
- 所有变更必须生成、审查并执行迁移；不能只修改 TypeScript Schema。
- 以下为逻辑模型，字段命名可按仓库 Drizzle 风格映射，不得改变约束语义。

## 2. organizations

| 字段       | 类型/约束                   | 说明                                 |
| ---------- | --------------------------- | ------------------------------------ |
| id         | uuid PK，默认随机           | 稳定路由/API 标识                    |
| name       | text NOT NULL               | 服务端 trim 后 1–80 字符，不全局唯一 |
| created_by | uuid NOT NULL FK → users.id | 仅审计，不是永久 owner               |
| created_at | timestamptz NOT NULL        | 创建时间                             |
| updated_at | timestamptz NOT NULL        | 更新时间                             |

`created_by` 默认采用 RESTRICT，防止在用户删除策略未定义时静默丢失组织审计；全局用户删除不在本版范围。

## 3. memberships

| 字段            | 类型/约束                                             | 说明                              |
| --------------- | ----------------------------------------------------- | --------------------------------- |
| id              | uuid PK                                               | Membership 标识，用于成员管理接口 |
| organization_id | uuid NOT NULL FK → organizations.id ON DELETE CASCADE | 所属组织                          |
| user_id         | uuid NOT NULL FK → users.id ON DELETE CASCADE         | 全局用户                          |
| role            | enum(`admin`,`member`) NOT NULL                       | 组织角色                          |
| created_at      | timestamptz NOT NULL                                  | 加入时间                          |
| updated_at      | timestamptz NOT NULL                                  | 最近变更时间                      |

索引与约束：

- UNIQUE `(organization_id, user_id)`：防止重复成员关系。
- INDEX `(user_id)`：查询当前用户组织列表。
- INDEX `(organization_id, role)`：admin 数量与角色管理。
- INDEX `(organization_id, created_at)`：稳定成员列表分页/排序。

移除成员删除的是本表记录；`user_id` 的级联只在未来明确删除全局用户时生效，与“移除组织成员”无关。

## 4. organization_invitations

| 字段            | 类型/约束                                               | 说明                          |
| --------------- | ------------------------------------------------------- | ----------------------------- |
| id              | uuid PK                                                 | 管理接口内部邀请 ID           |
| organization_id | uuid NOT NULL FK → organizations.id ON DELETE CASCADE   | 目标组织                      |
| email           | text NOT NULL                                           | trim + lowercase 后的目标邮箱 |
| role            | enum(`admin`,`member`) NOT NULL DEFAULT member          | 本版服务层只允许 member       |
| token_hash      | text NOT NULL UNIQUE                                    | 原始 token 的带密钥摘要       |
| invited_by      | uuid NOT NULL FK → users.id                             | 邀请者审计                    |
| status          | enum(`pending`,`accepted`,`revoked`,`expired`) NOT NULL | 邀请状态                      |
| expires_at      | timestamptz NOT NULL                                    | 默认创建后 7 天               |
| accepted_at     | timestamptz NULL                                        | 接受时间                      |
| revoked_at      | timestamptz NULL                                        | 撤销时间                      |
| created_at      | timestamptz NOT NULL                                    | 创建时间                      |
| updated_at      | timestamptz NOT NULL                                    | 最近状态/重发处理时间         |

索引与约束：

- UNIQUE `token_hash`。
- UNIQUE `(organization_id, email) WHERE status = 'pending'`：同一组织同邮箱最多一条 pending。
- INDEX `(organization_id, status, expires_at)`：邀请管理和过期判断。
- INDEX `(organization_id, created_at)`：稳定列表排序。
- 必要时通过 CHECK 保证 accepted/revoked 与时间字段语义一致，但不依赖 CHECK 代替业务状态校验。

过期始终由 `expires_at <= 服务端当前时间` 判定。存储的 expired 是规范化结果；没有定时任务时也必须拒绝过期接受。重邀事务先把过期 pending 规范化，再插入新 pending，并利用部分唯一索引处理并发。

## 5. organization_audit_logs

| 字段                  | 类型/约束                                  | 说明                          |
| --------------------- | ------------------------------------------ | ----------------------------- |
| id                    | uuid PK                                    | 审计记录 ID                   |
| organization_id       | uuid NOT NULL，不设级联 FK                 | 组织删除后仍可保留最小审计    |
| actor_user_id         | uuid NULL FK → users.id ON DELETE SET NULL | 操作者                        |
| action                | text NOT NULL                              | 受控动作枚举/常量             |
| target_type/target_id | text/uuid NULL                             | 成员、邀请或组织目标          |
| request_id            | text NOT NULL                              | 关联请求日志                  |
| metadata              | jsonb NOT NULL 默认空对象                  | 仅最小安全上下文，如旧/新角色 |
| created_at            | timestamptz NOT NULL                       | 服务端时间                    |

INDEX `(organization_id, created_at)`。禁止写入原始 token、tokenHash、密码、验证码、Auth token 或 SMTP 信息。成员/角色事务内写审计；组织删除后在事务中保留一条最小删除审计。

## 6. Project 的未来归属约束

当前仓库没有 Project 表，本功能迁移不创建虚假项目模型，也不进行历史项目回填。项目首次实现时必须：

1. 包含 `organization_id uuid NOT NULL FK → organizations.id`。
2. 不允许 NULL organizationId 或仅以 userId 作为归属。
3. 对纯数据库且确认可级联的数据使用 ON DELETE CASCADE；外部资源不得依靠数据库 CASCADE 宣称清理。
4. 同步更新组织删除事务、异步清理边界和测试。

## 7. 关键事务设计

### 7.1 创建组织

单事务：校验用户 → 插入 Organization → 插入创建者 admin Membership → 写审计 → 返回。任何一步失败全部回滚。

### 7.2 接受邀请

单事务：锁定邀请行 `FOR UPDATE` → 重检状态/过期/用户邮箱 → 插入或幂等取得 Membership → 条件更新 accepted → 写审计。数据库唯一约束处理并发冲突。

### 7.3 角色变更与移除

单事务：锁定目标 Organization 行 → 重检操作者 admin → 确认目标 Membership 属于该组织 → 计算变更后的 admin 数 → 更新/删除 → 写审计。组织行锁序列化同一组织的敏感变更，防止并发失去最后 admin。

### 7.4 邀请创建与重邀

单事务：重检 admin → 规范化旧过期邀请 → 检查成员和有效 pending → 插入记录/写审计。SMTP 在事务外执行，首次失败按邀请文档补偿删除。

## 8. 组织删除策略

### 8.1 当前版本：数据库内硬删除

当前仅有数据库模型，没有 Project、外部存储或云资源清理能力，因此第一版采用明确的数据库事务硬删除：

1. 仅本组织 admin 可发起，前端输入组织名称二次确认。
2. 事务内锁定 Organization 并再次校验 admin。
3. 写最小组织删除审计。
4. 删除 Organization；数据库 CASCADE 删除本组织 Membership 和 Invitation。
5. 保留全局 users、Auth sessions/tokens、其他组织及其全部数据。
6. 提交后返回成功；前端清理当前组织上下文并跳转。

并发删除由组织行锁和删除后不存在语义保证；重复请求不得返回虚假的新删除结果。被删除组织的旧路由和旧缓存均不能继续通过 API 授权。

### 8.2 明确不包含的清理

本版不宣称清理项目、项目数据库、存储对象、API Key、日志、后台任务或任何外部云资源。上述模型当前不存在，不能生成虚假的清理成功响应。

### 8.3 未来外部资源接入条件

一旦组织拥有外部资源，在开放对应删除能力前必须升级为两阶段流程：

- 软删除/删除中状态，立即阻断所有组织访问并防止并发重复任务。
- 可重试删除任务，逐项记录资源清理状态、错误和重试次数。
- 所有外部资源完成后再执行数据库最终删除；失败时保持可观测、可重试，不能报告“已彻底删除”。
- 外部清理任务不包含明文邀请/Auth token，并有超时和告警。

## 9. 迁移与兼容计划

1. 新增组织角色/邀请状态枚举及上述表、索引、外键。
2. 在空数据库执行 generate + migrate，再检查 Schema 与迁移快照一致。
3. 在包含现有 Auth 用户/会话的数据库执行迁移，确认不重建或修改 Auth 表。
4. 不为已有用户自动创建组织；已有用户登录后无组织则进入创建组织页。
5. 验证回滚策略：Drizzle 前向迁移为主，至少先在可丢弃环境验证失败恢复和备份，不直接对未备份数据实验。
6. 迁移后跑 Auth 回归、组织集成测试及唯一约束/并发测试。

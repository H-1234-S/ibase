# 后端实现设计

## 1. 当前实现基础

API 位于 `apps/api`，使用 NestJS 12、Drizzle ORM 0.44、PostgreSQL `pg` 驱动、`class-validator`/`class-transformer` 和全局 ValidationPipe。API 前缀是 `/api`。当前 Schema 为空。Redis URL 已在本地配置示例中出现，但 API 未连接 Redis。邮件、Redis 客户端、JWT 与密码哈希依赖当前均未安装。

实现时只在 `apps/api` 增加后端运行依赖：建议 Redis 客户端选用 `ioredis` 或 `redis`（选一种并保持 Nest 生命周期管理）；JWT 使用 Nest 生态 JWT 库或等效的 `jose`；密码使用成熟 Argon2id 库；邮件用 `nodemailer`。依赖具体选择在实施时核对 Node 24/平台支持，不重复引入已有工具。

## 2. NestJS 模块职责

- `AuthModule`：组合控制器、用例服务、Guard、策略配置。
- `AuthController`：路由、Cookie 读写/清理、DTO 和 HTTP 状态；不实现业务规则。
- `AuthService`：协调注册、登录、me、刷新和退出流程。
- `PasswordService`：Argon2id 哈希与验证。
- `EmailCodeService`：安全随机码、Redis 原子存取/消费及限流。
- `EmailService`：Nodemailer QQ SMTP 发送；对调用层抛出明确错误，不吞异常。
- `SessionService`：签发、摘要、校验、轮换和撤销 Refresh 会话。
- `JwtAuthGuard` / `CurrentUser`：统一认证与当前用户注入。
- 配置校验：扩展现有 `validateEnvironment`，生产密钥缺失或弱值时启动失败。

目录仅作职责提议，实施时遵循仓库 `.js` 扩展名导入和现有模块风格。

## 3. 数据模型提案

### `users`

`id`（项目统一主键）、`name`、规范化 `email`、`password_hash`、`email_verified_at`、`created_at`、`updated_at`。字段必要时 `NOT NULL`；对规范化邮箱建立唯一索引。数据库约束负责最终并发冲突检测。

### `auth_sessions`

建议字段：`id`（会话/Token family ID）、`user_id` 外键、`refresh_token_hash`、`created_at`、`last_used_at`、`expires_at`（绝对过期）、`idle_expires_at` 或可由最后活动加策略计算、`revoked_at`、`replaced_by_session/token_id` 或轮换序号、必要的审计时间。摘要应使用 SHA-256/HMAC 等效单向摘要；Refresh JWT 本身具备高熵，但可使用服务端密钥做 HMAC 摘要以减少数据库泄露风险。索引覆盖 user_id、有效会话和过期清理。

事务/条件更新必须做到旧摘要仅能匹配并替换一次。旧摘要再次出现即按安全优先策略撤销目标 token family；由于无法区分合法并发和恶意重放，并发请求的失败方也可能导致该会话重新登录。定期清理过期/撤销记录可使用定时任务或运维 SQL；首版不需要后台队列。

## 4. Redis Key 和原子操作

Key 采用带版本及用途前缀，例如：

- `auth:v1:email-code:{normalizedEmail}`：验证码摘要，TTL 300 秒。
- `auth:v1:email-send-lock:{normalizedEmail}`：发送锁，短 TTL。
- `auth:v1:email-cooldown:{normalizedEmail}`：冷却计数/窗口。
- `auth:v1:email-attempts:{normalizedEmail}`：错误尝试，TTL 不超过验证码生命周期。
- `auth:v1:rate:{dimension}:{subject}:{window}`：登录、注册、IP 发送等限流窗口。

邮箱部分建议使用 HMAC 后的标识，避免 Redis key 泄露邮箱。使用 Lua 脚本或等效原子操作实现限流检查与计数、验证码校验并删除、错误次数递增/耗尽和邮件发送状态提交/失败清理。多 key 脚本必须使用同 Redis Cluster hash slot 规则，若部署为 Cluster。Redis 故障按失败关闭处理。

## 5. 邮件发送

Nodemailer transport 使用 QQ service provider：`service: 'qq'`，`auth.user` 从 `EMAIL_USER` 读取，`auth.pass` 从 `EMAIL_PASSWORD` 读取；发件人名称/地址可用 `EMAIL_FROM`，没有单独配置时由账号构成但必须明确校验。环境变量名统一为全大写 `EMAIL_PASSWORD`，避免示例中的 `Email_PASSWORD` 大小写差异导致 Windows 与 Linux 行为不一致。

发信内容包括验证码、5 分钟有效提示和忽略非本人请求提示。验证码不得写到日志。传输器作为单例注入，发送超时应有上限。发送失败返回安全的 5xx 错误，不向用户返回 SMTP 错误细节，并按架构文档清理未发布的验证码状态。

## 6. 注册与认证流程

- 注册顺序：DTO → 邮箱规范化 → Redis 原子校验并消费验证码 → Argon2id → 插入 users → 创建 session 并签发凭证。数据库插入失败时验证码保持消费；唯一冲突返回 409。若用户创建成功但会话创建失败，应明确回滚用户插入（数据库事务）或让该用户可重新登录；建议用户和会话插入同一 PostgreSQL 事务，JWT Cookie 仅在事务成功后设置。
- 登录：先按来源 IP/网络及规范化账号维度执行原子限流检查/计数，再查用户并执行 Argon2id；不存在账号可执行虚拟 hash 比对减轻时序枚举。只有通过前置限流的请求才允许进入昂贵哈希操作。增加全局/IP 并发上限或有界队列，避免分散账号绕过账号限额造成 CPU 洪峰；达到限流立即返回 429，不做 Argon2id。密码正确后建立新 session 并设置 Cookie。日志和异常不含密码。
- Access Guard 验证必要 JWT claims 后，从 `sub` 查询活动用户或通过安全缓存确认用户有效；将“仅过期”映射为 `ACCESS_TOKEN_EXPIRED`，其他非法/撤销凭证映射为 `UNAUTHENTICATED`。停用字段若当前模型没有则首版不造状态，需产品定义后再加入。
- Refresh：验证 refresh cookie、签名/type/claims → 原子轮换 session 摘要 → 设置两枚新 Cookie。任何已轮换旧摘要再次出现都撤销该会话并拒绝；前端单飞避免同页合法并发。失败返回 401 并清理凭证。轮换不得把 refresh token 暴露给 JSON。
- Logout：定位并撤销 Refresh Cookie 对应的服务端会话；撤销事务提交成功后才清除 Cookie 并返回成功。缺失/已撤销凭证时仍可幂等清 Cookie；数据库/存储故障时不得假报登出成功，应返回服务端错误。登出后旧 Refresh Token 必须无法刷新。

## 7. 配置、错误与日志

配置读取沿用 `ConfigModule` 与现有启动校验。生产环境要求强随机独立 Access/Refresh 密钥、合法 Origin、数据库/Redis URL、邮件账号与授权码；本地可使用明确的开发配置，但不能静默回退到固定生产密钥。新 Schema 进入现有 Drizzle schema registry，并生成实际 SQL migration。

仅通过统一 HTTP 异常层映射业务错误码。服务内部异常原样向上抛，边界处转换为不含底层详情的客户端错误并记录 request ID。敏感字段在日志层过滤。

## 8. 多租户扩展边界

`users` 是全局身份，不直接加入必填 `org_id`。预留未来独立 `orgs` 与 `members`：成员关联 `user_id` 和 `org_id`，其唯一性/状态/角色由成员模型承载。首版认证 Guard 只建立全局 `CurrentUser`；未来组织路由通过独立的组织上下文解析与成员 Guard/授权策略检查当前成员资格。不要把用户认证与组织授权混为一层，也不要在 Access Token 中长期缓存组织角色。

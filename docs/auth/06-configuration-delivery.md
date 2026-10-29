# 配置、实施与验收

## 1. 环境变量规划

不在文档中记录真实 `.env` 值；实现时检查变量名是否已存在并保留现有本地环境。`.env.example` 仅含占位符。

| 变量                                           | 用途                  | 建议/规则                                          |
| ---------------------------------------------- | --------------------- | -------------------------------------------------- |
| `DATABASE_URL`                                 | PostgreSQL            | 仓库已存在；继续使用。                             |
| `REDIS_URL`                                    | Redis                 | 仓库已存在；认证依赖不可用时失败关闭。             |
| `API_PORT`                                     | API 监听端口          | 仓库已存在。                                       |
| `NODE_ENV`                                     | 环境识别              | 区分开发、测试、生产。                             |
| `WEB_ORIGIN`                                   | 精确允许的前端 Origin | 生产必填；不接受通配符。                           |
| `API_PUBLIC_URL`                               | API 公网基址/部署文档 | 按部署需要。                                       |
| `JWT_ACCESS_SECRET`                            | Access 签名密钥       | 强随机、生产必填。                                 |
| `JWT_REFRESH_SECRET`                           | Refresh 签名密钥      | 与 Access 分离，生产必填。                         |
| `JWT_ACCESS_TTL`                               | Access 有效期         | 默认 15m。                                         |
| `JWT_REFRESH_TTL`                              | Refresh 有效期        | 默认 7d；同时受会话绝对期限约束。                  |
| `JWT_ISSUER` / `JWT_AUDIENCE`                  | JWT 验证声明          | 所有环境显式一致。                                 |
| `AUTH_SESSION_ABSOLUTE_TTL`                    | 会话绝对期限          | 建议 30d，待审核。                                 |
| `AUTH_SESSION_IDLE_TTL`                        | 会话空闲期限          | 建议 7d，待审核。                                  |
| `AUTH_COOKIE_SECURE` / `AUTH_COOKIE_SAME_SITE` | Cookie 环境策略       | 生产 secure 必须 true；SameSite 与拓扑一致。       |
| `AUTH_COOKIE_DOMAIN`                           | 可选 Cookie Domain    | 默认不设置；不使用宽泛 Domain。                    |
| `EMAIL_USER`                                   | QQ 邮箱/SMTP 用户     | 用户已说明配置在本地 env；实施时确认变量名。       |
| `EMAIL_PASSWORD`                               | QQ SMTP 授权码        | 使用 SMTP 授权码，不是邮箱网页登录密码；绝不记录。 |
| `EMAIL_FROM`                                   | 发件人                | 可配置发件名/地址。                                |
| `AUTH_EMAIL_CODE_TTL_SECONDS`                  | 验证码 TTL            | 固定且校验为 300 秒。                              |
| `AUTH_EMAIL_CODE_COOLDOWN_SECONDS`             | 发信冷却              | 建议 60 秒。                                       |
| `AUTH_EMAIL_CODE_MAX_ATTEMPTS`                 | 验证尝试上限          | 建议 5 次。                                        |
| `AUTH_EMAIL_RATE_LIMIT_*`                      | 邮箱/IP 发信额度      | 建议每邮箱 5 次/小时、每 IP 20 次/小时。           |
| `AUTH_LOGIN_IP_RATE_LIMIT_*`                   | 登录来源限流          | 在 Argon2id 验证前检查；按 IP/网络限制请求频率。   |
| `AUTH_LOGIN_HASH_CONCURRENCY`                  | 密码验证并发上限      | 限制昂贵 Argon2id 工作数；超限有界排队或立即 429。 |
| `AUTH_LOGIN_RATE_LIMIT_*`                      | 登录限流              | 依据 IP + 规范化账号组合设定。                     |

重要：用户提供的示例出现 `Email_PASSWORD` 大小写写法，本文统一为 `EMAIL_PASSWORD`。Windows 文件系统通常不区分变量名大小写，而 Linux 区分；实现前应检查本地 `.env` 中的变量名（不打印值），必要时只改变量名而保留凭证内容。

## 2. 大厂式实施流程

1. **需求评审**：确认本目录决策、待确认项、验收人及安全边界。
2. **技术设计评审**：确认 ORM/Redis/JWT/Argon2/Nodemailer 具体库、Cookie 部署拓扑、错误契约和限流参数。
3. **基础设施与 Schema**：配置校验、数据库模型、迁移、Redis 客户端与原子脚本。
4. **后端纵向切片**：邮件验证码 → 注册 → 登录 → Guard/me → refresh/logout；每段配单元/集成覆盖。
5. **前端纵向切片**：统一请求/错误契约 → 登录/注册 → 当前用户恢复 → 刷新并发处理 → 退出。
6. **集成和安全验证**：真实 PostgreSQL/Redis，邮件测试替身或受控测试邮箱；验证 CSRF、限流、并发轮换、脱敏。
7. **发布准备**：迁移前后兼容性、环境密钥与 SMTP 授权码配置、回滚/监控指标和运维说明。

实施时遵守仓库 `AGENTS.md`：遵循 workspace 包管理；按功能添加测试并先证明关键缺陷；测试文件镜像源文件结构；不覆盖真实 `.env`；不升级无关依赖。Turborepo 配置不在本次文档阶段变更。

## 3. 测试与验收清单

### 后端单元/集成

- [ ] DTO 必填、邮箱、密码长度/规则、验证码格式校验。
- [ ] 正常注册、邮箱已存在、并发唯一冲突；仅一个用户创建。
- [ ] 验证码正确、错误、过期、重复消费、超过尝试次数；原子性并发测试。
- [ ] 邮件发送成功/失败；失败不遗留可验证验证码，敏感内容不进入日志。
- [ ] Redis 不可用时发送/注册/限流失败关闭。
- [ ] 登录成功、未注册、密码错误、限流及虚拟哈希时序路径；限流检查发生在 Argon2id 之前，并验证洪峰请求不能无限占用哈希 CPU。
- [ ] Cookie flags、Path、Max-Age、SameSite、Secure、HttpOnly 与清除行为。
- [ ] Access Guard 验证签名、issuer/audience/type/exp；用户失效时拒绝访问。
- [ ] Refresh 摘要轮换、过期/撤销拒绝、旧 Token 重放即撤销会话；并发请求按安全优先策略验证，明确败方可能要求重新登录。
- [ ] Logout 服务端撤销会话后旧 Refresh Token 刷新必定失败；撤销存储故障时不返回成功；幂等清理 Cookie；CSRF/Origin 校验。
- [ ] `ACCESS_TOKEN_EXPIRED` 与 `UNAUTHENTICATED` 区分；只对前者触发一次刷新，refresh 401 不循环。
- [ ] 数据库迁移可应用；无明文密码、Token 或验证码持久化/日志。

### 前端

- [ ] 登录与注册字段反馈、提交加载态、重复提交防护、错误码到 UI 映射。
- [ ] 验证码按钮倒计时服从服务端 `retryAfter`。
- [ ] `/me` 页面刷新恢复；未认证页面体验及 API 独立保护。
- [ ] Access 失效时并发请求只触发单个刷新；原请求最多重放一次。
- [ ] 刷新失败清理用户状态；刷新端点、网络错误、403、业务错误不循环刷新。
- [ ] Cookie 请求含 credentials；前端未持久化 Token。

### 工程检查

- [ ] API/Web 类型检查、Lint、构建、单元和集成测试通过。
- [ ] Drizzle migration 生成并在干净数据库应用。
- [ ] 前后端使用共享 API 类型/错误码，OpenAPI 与实现一致（若沿用 Swagger）。
- [ ] 生产配置缺少安全密钥时启动失败，`.env.example` 不含真实凭证。
- [ ] 记录外部服务未就绪导致未执行的检查，不将其描述为通过。

## 4. 评审待确认项

1. Web 与 API 的实际生产/开发域名和部署关系是什么？是否可通过同源反向代理部署？这决定 SameSite、Cookie Path、CORS 和 CSRF 配置。
2. 发送验证码时，邮箱已注册是否返回明确错误，还是为减少邮箱枚举统一返回通用成功？登录错误仍按原需求区分未注册和密码错误，是否接受枚举风险及对应限流？
3. 用户名允许哪些字符/长度，是否允许邮箱大小写规范化之外的别名处理？
4. 是否接受本文建议的会话策略：Access 15 分钟、Refresh 7 天、会话绝对 30 天、空闲 7 天、退出时 Access 最多自然存活 15 分钟？
5. 限流建议值（验证码冷却 60 秒、每邮箱 5 次/小时、每 IP 20 次/小时、最多 5 次验证尝试）是否符合预期？
6. 本地 `.env` 中邮件变量名是否为 `EMAIL_USER` 和 `EMAIL_PASSWORD`？无需提供变量值。发件人是否希望固定显示名称？

7. 是否接受安全优先的 Refresh 并发策略：跨标签尽力加锁；同一旧 token 的第二次使用视为重放并撤销当前会话，因此极端竞争时需重新登录？如需无感并发恢复，须接受有界幂等窗口带来的重放风险并单独评审。
8. 多租户第一版是否仅预留边界而暂不创建组织/成员功能？本文建议用户是全局身份，未来通过独立 `orgs`/`members` 建模，组织内权限按服务端成员关系校验。

审核通过后再进入代码实现；本轮交付仅包含这组需求和设计文档。

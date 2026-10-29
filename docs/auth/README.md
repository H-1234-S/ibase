# Auth 认证模块文档

本目录是 Auth 模块的需求基线、技术设计和交付计划。当前阶段用于评审，确认后再按文档实施。文档依据当前仓库结构编写；实现细节以评审后的决定及实际代码为准。

## 文档导航

1. [产品需求与范围](./01-requirements.md)：目标、用户流程、验收边界。
2. [系统架构与安全设计](./02-architecture-security.md)：职责边界、会话模型、Cookie/CSRF、风险控制。
3. [API 契约](./03-api-contract.md)：请求/响应、错误码与状态码。
4. [后端实现设计](./04-backend-design.md)：NestJS、Drizzle、PostgreSQL、Redis、邮件与迁移。
5. [前端实现设计](./05-frontend-design.md)：页面、表单、请求封装、登录态恢复与刷新。
6. [配置、实施与验收](./06-configuration-delivery.md)：环境变量、分阶段实施、测试与验收清单。

## 当前仓库基线

- `apps/web`：Next.js App Router + React + TypeScript，目前为起始页面；未发现认证页面、请求客户端或登录态方案。
- `apps/api`：NestJS 12，已启用全局 DTO 校验，API 全局前缀为 `/api`。
- 数据库：PostgreSQL + Drizzle ORM + `pg`；当前 Schema 为空，迁移目录由 Drizzle 管理。
- Redis：本地服务在 Compose 中定义，API 当前尚未连接 Redis，也未安装 Redis 客户端。
- 邮件：未发现邮件服务或 Nodemailer 依赖。按需求采用 Nodemailer 的 QQ SMTP 服务配置。
- `.env.example` 当前仅含 PostgreSQL、Redis 和 API 端口配置。真实 `.env` 不纳入文档或版本控制内容。
- 共享包已有 `@ibase/shared-types`，可承载前后端共用的公开用户/API 契约；实现时应先检查并按需扩展。

## 评审状态

请先审核本目录。尤其确认 [系统架构与安全设计](./02-architecture-security.md) 中的部署域名、Cookie/CSRF策略和 Refresh Token 并发策略，以及 [配置、实施与验收](./06-configuration-delivery.md) 中标记为待确认的产品规则。完成审核后再开始代码实现。

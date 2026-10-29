# API

NestJS API service. It listens on port `3001` by default and reads local configuration from the repository root `.env` file. Set `API_PORT` to change the listening port.

## Local database setup

From the repository root, copy `.env.example` to `.env`, then start the local data services:

```sh
pnpm db:up
```

PostgreSQL is exposed on `localhost:5432`; Redis is exposed on `localhost:6379`. The API uses PostgreSQL through Drizzle ORM and `node-postgres`, and Redis through the global `RedisModule` for email codes, rate limits, and bounded password-hash concurrency.

## Drizzle

Schema definitions are split by table under `src/database/schemas/`; `index.ts` only exports the schema registry. Manage SQL migrations with:

```sh
pnpm db:generate
pnpm db:migrate
```

Use `pnpm --filter api db:studio` to open Drizzle Studio.

Swagger UI is available at `http://localhost:3001/api/docs` by default.

Authentication routes are under `/api/auth`: `email/send-code`, `register`, `login`, `me`, `refresh`, and `logout`. JWTs are delivered only as HttpOnly cookies. The Web app proxies `/api/*` to `API_BASE_URL`, so local browser requests remain same-origin.

## Run the API

```sh
pnpm dev --filter=api
```

# API

NestJS API service. It listens on port `3001` by default and reads local configuration from the repository root `.env` file.

## Local database setup

From the repository root, copy `.env.example` to `.env`, then start the local data services:

```sh
pnpm db:up
```

PostgreSQL is exposed on `localhost:5432`; Redis is exposed on `localhost:6379`. The API uses PostgreSQL through Drizzle ORM and `node-postgres`. Redis is available for application features through `REDIS_URL` but is not connected to an API module yet.

## Drizzle

Schema definitions are in `src/database/schemas/index.ts`. Add tables there, then manage SQL migrations with:

```sh
pnpm db:generate
pnpm db:migrate
```

Use `pnpm --filter api db:studio` to open Drizzle Studio.

## Run the API

```sh
pnpm dev --filter=api
```

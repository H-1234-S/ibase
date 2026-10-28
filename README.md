# ibase

pnpm monorepo managed with Turborepo.

## Workspace

- `apps/web`: Next.js application on port 3000.
- `apps/docs`: Next.js documentation application on port 3002.
- `apps/api`: NestJS API.
- `packages/ui`: shared shadcn/ui components and Tailwind theme.
- `packages/shared-types`: shared web/API contracts.
- `packages/constants`: shared application constants.
- `packages/typescript-config`: shared TypeScript compiler configurations.
- `packages/eslint-config`: shared ESLint configurations.

## Requirements

- Node.js 24 or newer
- pnpm 12.6.0

## Common commands

```sh
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm check-types
pnpm format
pnpm format:check
```

## Local data services

```sh
Copy-Item .env.example .env
pnpm db:up
pnpm dev
```

PostgreSQL is available at `localhost:5432`; Redis is available at `localhost:6379`. Both use named Docker volumes and bind to loopback. API database schema and Drizzle migrations live in `apps/api`; after adding tables, run `pnpm db:generate` and `pnpm db:migrate`.

The root `.prettierrc` is the formatting source for the whole repository. Shared tool versions are declared in `pnpm-workspace.yaml`'s catalog.

To add shadcn/ui components, run the shadcn CLI from `packages/ui`; import shared components from `@ibase/ui/components/ui/...` in either Next.js app.

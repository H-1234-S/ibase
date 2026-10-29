# Web

Next.js application on port `3000`.

Run it from the repository root so Turborepo builds the shared workspace dependencies first:

```sh
pnpm dev --filter=web
```

Application source lives under `src`, with App Router routes in `src/app` and authentication features in `src/features/auth` (API, components, context, and hooks). Authentication pages are `/login` and `/register`. The Next.js rewrite proxies `/api/*` to `API_BASE_URL` (defaults to `http://localhost:3001`).

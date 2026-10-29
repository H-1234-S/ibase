# Web

Next.js application on port `3000`.

Run it from the repository root so Turborepo builds the shared workspace dependencies first:

```sh
pnpm dev --filter=web
```

Authentication pages are `/login` and `/register`. The feature implementation lives under `features/auth` with separate API, components, context, and hooks directories. The Next.js rewrite proxies `/api/*` to `API_BASE_URL` (defaults to `http://localhost:3001`).

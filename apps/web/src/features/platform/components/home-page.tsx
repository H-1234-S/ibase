import Link from 'next/link';
import { API_HEALTH_PATH, APP_NAME } from '@ibase/constants';
import type { ApiHealthResponse } from '@ibase/shared-types';
import { Badge } from '@ibase/ui/components/ui/badge';
import { Button } from '@ibase/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ibase/ui/components/ui/card';
import { AuthStatus } from '../../auth/components/auth-status';

async function getApiHealth() {
  const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3001';
  const response = await fetch(new URL(`/api/${API_HEALTH_PATH}`, apiBaseUrl), {
    cache: 'no-store',
    signal: AbortSignal.timeout(3000),
  });

  if (!response.ok) return null;
  return (await response.json()) as ApiHealthResponse;
}

/** Shows API health and provides entry points to the ibase workspace. */
export async function HomePage() {
  let health: ApiHealthResponse | null = null;
  try {
    health = await getApiHealth();
  } catch {
    health = null;
  }

  const isAvailable = health?.status === 'ok';

  return (
    <div className="min-h-screen bg-[var(--console-canvas)] text-[var(--console-ink)]">
      <header className="border-b border-[var(--console-line)] bg-[var(--console-canvas)]">
        <nav
          aria-label="主导航"
          className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 px-6"
        >
          <Link
            aria-label={`${APP_NAME} 首页`}
            className="flex items-center gap-2 text-sm font-semibold tracking-[-0.28px] text-[var(--console-ink)] no-underline"
            href="/"
          >
            <span className="grid size-8 place-items-center rounded-[6px] bg-[var(--console-ink)] text-sm text-white">
              i
            </span>
            {APP_NAME}
          </Link>
          <AuthStatus />
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] md:items-center md:gap-16 md:py-24">
        <section>
          <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--console-mute)]">
            Backend platform / status
          </p>
          <h1 className="mt-6 max-w-xl text-[32px] font-semibold leading-10 tracking-[-1.28px] text-[var(--console-ink)] sm:text-[48px] sm:leading-[48px] sm:tracking-[-2.4px]">
            后端服务状态
          </h1>
          <p className="mt-6 max-w-lg text-base leading-6 text-[var(--console-body)]">
            查看 ibase API 与数据库连接状态，随后进入你的组织工作区。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="h-11 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
            >
              <Link href="/dashboard">打开工作区</Link>
            </Button>
            <Button
              asChild
              className="h-11 rounded-[6px] border-[var(--console-line)] bg-white px-1.5 text-sm text-[var(--console-ink)] hover:bg-[var(--console-soft)]"
              variant="outline"
            >
              <Link href={`/api/${API_HEALTH_PATH}`} target="_blank">
                查看健康接口
              </Link>
            </Button>
          </div>
        </section>

        <Card className="rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
          <CardHeader className="gap-2 p-6 pb-6">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-[20px] font-semibold leading-7 tracking-[-0.4px] text-[var(--console-ink)]">
                服务检查
              </CardTitle>
              <Badge
                variant="outline"
                className={`gap-2 rounded-[6px] border-[var(--console-line)] px-2 py-1 font-normal ${
                  isAvailable
                    ? 'text-[var(--console-blue)]'
                    : 'text-[var(--console-error)]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${
                    isAvailable
                      ? 'bg-[var(--console-blue)]'
                      : 'bg-[var(--console-error)]'
                  }`}
                />
                {isAvailable ? '可用' : '不可用'}
              </Badge>
            </div>
            <CardDescription className="text-sm leading-5 text-[var(--console-body)]">
              健康检查接口：/api/{API_HEALTH_PATH}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-6 pt-0">
            <div className="flex items-center justify-between border-t border-[var(--console-line)] py-4 text-sm">
              <span className="text-[var(--console-body)]">API 服务</span>
              <span className="font-medium text-[var(--console-ink)]">
                {isAvailable ? '已连接' : '连接失败'}
              </span>
            </div>
            {isAvailable && (
              <div className="flex items-center justify-between border-t border-[var(--console-line)] py-4 text-sm">
                <span className="text-[var(--console-body)]">PostgreSQL</span>
                <span className="font-medium text-[var(--console-ink)]">
                  {health?.dependencies.postgresql === 'ok' ? '可用' : '不可用'}
                </span>
              </div>
            )}
            {!isAvailable && (
              <p className="border-t border-[var(--console-line)] pt-4 text-sm leading-5 text-[var(--console-body)]">
                启动 API 服务后刷新此页面，即可重新检查连接状态。
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-[var(--console-line)] px-6 py-6 text-center text-xs text-[var(--console-mute)]">
        © 2026 {APP_NAME}
      </footer>
    </div>
  );
}

import { API_HEALTH_PATH, APP_NAME } from '@ibase/constants';
import type { ApiHealthResponse } from '@ibase/shared-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ibase/ui/components/ui/card';

async function getApiHealth() {
  const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3001';

  try {
    const response = await fetch(
      new URL(`/api/${API_HEALTH_PATH}`, apiBaseUrl),
      { cache: 'no-store', signal: AbortSignal.timeout(3000) },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ApiHealthResponse;
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getApiHealth();
  const isAvailable = health?.status === 'ok';

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-2xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-sm font-medium text-muted-foreground">
            {APP_NAME}
          </h1>
          <p className="text-muted-foreground">
            查看 API 服务和数据库是否可用。
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>API 服务</CardTitle>
            <CardDescription>
              健康检查接口：/api/{API_HEALTH_PATH}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">当前状态</span>
            <span
              className={`inline-flex items-center gap-2 text-sm font-medium ${
                isAvailable ? 'text-emerald-600' : 'text-destructive'
              }`}
            >
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${
                  isAvailable ? 'bg-emerald-600' : 'bg-destructive'
                }`}
              />
              {isAvailable ? '可用' : '不可用'}
            </span>
          </CardContent>
          {isAvailable && (
            <CardContent className="border-t pt-4 text-sm text-muted-foreground">
              PostgreSQL：
              {health.dependencies.postgresql === 'ok' ? '可用' : '不可用'}
            </CardContent>
          )}
        </Card>
      </div>
    </main>
  );
}

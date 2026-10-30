import Link from 'next/link';
import { Button } from '@ibase/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@ibase/ui/components/ui/card';
import { Badge } from '@ibase/ui/components/ui/badge';

/** Explains how to recover when the API cannot be reached. */
export function ServiceUnavailablePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--console-canvas)] px-6 py-16 text-[var(--console-ink)]">
      <div className="w-full max-w-xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--console-ink)] no-underline"
          href="/"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-[6px] bg-[var(--console-ink)] text-white"
          >
            i
          </span>
          ibase
        </Link>

        <Card className="mt-8 rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
          <CardHeader className="gap-3 p-6 pb-4 sm:p-8 sm:pb-6">
            <Badge
              variant="outline"
              className="w-fit rounded-[6px] border-[var(--console-line)] px-2 py-1 text-[var(--console-error)]"
            >
              服务状态
            </Badge>
            <CardTitle className="text-[20px] font-semibold leading-7 tracking-[-0.4px] sm:text-[32px] sm:leading-10 sm:tracking-[-1.28px]">
              API 服务暂不可用
            </CardTitle>
            <CardDescription className="text-sm leading-5 text-[var(--console-body)]">
              Web 暂时无法连接 API，因此不能验证你的登录状态。启动 API
              服务后重试。
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-8">
            <div className="flex items-start gap-3 border-t border-[var(--console-line)] py-4">
              <span
                aria-hidden="true"
                className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--console-error)]"
              />
              <p className="text-sm leading-5 text-[var(--console-body)]">
                登录状态会在服务恢复后自动重新检查。
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3 px-6 pb-6 sm:px-8 sm:pb-8">
            <Button
              asChild
              className="h-11 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-sm text-white hover:bg-[var(--console-body)]"
            >
              <Link href="/orgs">重试连接</Link>
            </Button>
            <Button
              asChild
              className="h-11 rounded-[6px] border-[var(--console-line)] bg-white px-1.5 text-sm text-[var(--console-ink)] hover:bg-[var(--console-soft)]"
              variant="outline"
            >
              <Link href="/">返回首页</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

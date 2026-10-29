import Link from 'next/link';
import { Button } from '@ibase/ui/components/ui/button';

export default function ServiceUnavailablePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16 text-[var(--console-ink)]">
      <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--console-mute)]">
        服务状态
      </p>
      <h1 className="mt-3 text-[32px] font-semibold leading-10 tracking-[-1.28px]">
        API 服务暂不可用
      </h1>
      <p className="mt-3 text-sm leading-5 text-[var(--console-body)]">
        Web 暂时无法连接 API，因此不能验证你的登录状态。启动 API 服务后重试。
      </p>
      <div className="mt-6 flex gap-3">
        <Button
          className="h-10 rounded-[6px] bg-[var(--console-ink)] px-1.5 text-white"
          asChild
        >
          <Link href="/dashboard">重试</Link>
        </Button>
        <Button
          className="h-10 rounded-[6px] border-[var(--console-line)] px-1.5"
          variant="outline"
          asChild
        >
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    </main>
  );
}

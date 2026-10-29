import Link from 'next/link';
import { Badge } from '@ibase/ui/components/ui/badge';
import { Button } from '@ibase/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ibase/ui/components/ui/card';

const sections = [
  {
    title: 'Web app',
    description: '面向用户的 Next.js 产品界面与组织工作区。',
    path: 'apps/web',
  },
  {
    title: 'API',
    description: 'NestJS 服务，负责身份验证、组织和数据接口。',
    path: 'apps/api',
  },
  {
    title: 'Shared UI',
    description: '基于 shadcn/ui 的共享组件和 Tailwind 主题。',
    path: 'packages/ui',
  },
  {
    title: 'Shared contracts',
    description: 'Web 与 API 共用的类型和常量。',
    path: 'packages/shared-types · packages/constants',
  },
];

/** Documents the ibase workspace packages and local development entry points. */
export function DocsHomePage() {
  return (
    <div className="min-h-screen bg-[var(--docs-canvas)] text-[var(--docs-ink)]">
      <header className="border-b border-[var(--docs-line)]">
        <nav
          aria-label="主导航"
          className="mx-auto flex min-h-14 max-w-6xl items-center justify-between px-6"
        >
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--docs-ink)] no-underline"
            href="/"
          >
            <span className="grid size-8 place-items-center rounded-[6px] bg-[var(--docs-ink)] text-white">
              i
            </span>
            ibase
          </Link>
          <Badge
            variant="outline"
            className="rounded-[6px] border-[var(--docs-line)] text-[var(--docs-body)]"
          >
            开发者文档
          </Badge>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <section>
          <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--docs-mute)]">
            Workspace / Overview
          </p>
          <h1 className="mt-6 text-[32px] font-semibold leading-10 tracking-[-1.28px] sm:text-[48px] sm:leading-[48px] sm:tracking-[-2.4px]">
            项目文档
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-6 text-[var(--docs-body)]">
            浏览 ibase monorepo 的应用、共享包和本地开发入口。
          </p>
        </section>

        <section
          aria-label="项目模块"
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {sections.map((section) => (
            <Card
              className="rounded-[12px] border-[var(--docs-line)] bg-white shadow-none"
              key={section.path}
            >
              <CardHeader className="p-6 pb-3">
                <CardTitle className="text-[20px] font-semibold leading-7 tracking-[-0.4px]">
                  {section.title}
                </CardTitle>
                <CardDescription className="min-h-10 text-sm leading-5 text-[var(--docs-body)]">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-3">
                <code className="block rounded-[6px] border border-[var(--docs-line)] bg-[var(--docs-canvas)] px-3 py-2 font-mono text-xs leading-4 text-[var(--docs-body)]">
                  {section.path}
                </code>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-medium uppercase leading-4 text-[var(--docs-mute)]">
                Local development
              </p>
              <h2 className="mt-2 text-[20px] font-semibold leading-7 tracking-[-0.4px]">
                本地开发入口
              </h2>
            </div>
            <p className="text-sm leading-5 text-[var(--docs-body)]">
              启动对应服务后访问。
            </p>
          </div>

          <Card className="rounded-[12px] border-[var(--docs-line)] bg-white shadow-none">
            <CardContent className="grid gap-3 p-6 sm:grid-cols-3 sm:gap-4">
              {[
                { label: 'Web', href: 'http://localhost:3000' },
                { label: 'API', href: 'http://localhost:3001' },
                { label: 'Docs', href: 'http://localhost:3002' },
              ].map((service) => (
                <Button
                  asChild
                  className="h-11 justify-between rounded-[6px] border-[var(--docs-line)] bg-white px-1.5 text-sm text-[var(--docs-ink)] hover:bg-[var(--docs-canvas)]"
                  key={service.label}
                  variant="outline"
                >
                  <Link href={service.href}>
                    <span>{service.label}</span>
                    <code className="font-mono text-xs text-[var(--docs-mute)]">
                      {service.href.replace('http://', '')}
                    </code>
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-[var(--docs-line)] px-6 py-6 text-center text-xs text-[var(--docs-mute)]">
        © 2026 ibase
      </footer>
    </div>
  );
}

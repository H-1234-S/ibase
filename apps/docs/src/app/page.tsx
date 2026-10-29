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
    description: 'The primary product interface built with Next.js.',
    path: 'apps/web',
  },
  {
    title: 'API',
    description: 'The NestJS service runs locally on port 3001.',
    path: 'apps/api',
  },
  {
    title: 'Shared UI',
    description: 'shadcn/ui components and shared Tailwind theme.',
    path: 'packages/ui',
  },
  {
    title: 'Shared contracts',
    description: 'Types and constants shared by web and API.',
    path: 'packages/shared-types · packages/constants',
  },
];

export default function Home() {
  return (
    <main className="container mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">ibase docs</p>
        <h1 className="text-4xl font-bold tracking-tight">项目文档</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          ibase monorepo 的应用入口、共享包和本地开发说明。
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.path}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <code className="text-sm text-muted-foreground">
                {section.path}
              </code>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">本地开发</h2>
        <Card>
          <CardContent className="grid gap-2 pt-6 text-sm sm:grid-cols-3">
            <p>Web： http://localhost:3000</p>
            <p>API： http://localhost:3001</p>
            <p>Docs： http://localhost:3002</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

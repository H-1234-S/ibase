import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ibase/ui/components/ui/card';
import { OrganizationPageHeader } from './organization-page-header';

/** Shows the project area until the project service is available. */
export function OrganizationProjectsPage() {
  return (
    <div>
      <OrganizationPageHeader
        eyebrow="组织工作区"
        title="项目"
        description="在一个组织中管理应用、环境和团队访问。"
      />

      <Card className="rounded-[12px] border-[var(--console-line)] bg-white shadow-none">
        <CardHeader className="border-b border-[var(--console-line)] p-6">
          <CardTitle className="text-[20px] font-semibold leading-7 tracking-[-0.4px]">
            组织项目
          </CardTitle>
        </CardHeader>
        <CardContent className="grid min-h-72 place-items-center p-6 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-12 place-items-center rounded-[12px] border border-[var(--console-line)] bg-[var(--console-canvas)] text-sm font-medium text-[var(--console-body)]">
              P
            </span>
            <h2 className="mt-4 text-[20px] font-semibold leading-7 tracking-[-0.4px] text-[var(--console-ink)]">
              项目将显示在这里
            </h2>
            <p className="mt-2 text-sm leading-5 text-[var(--console-body)]">
              项目管理功能接入后，你可以在这里创建和管理 BaaS 应用及其环境。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

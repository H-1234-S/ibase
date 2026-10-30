import { OrgConsoleShell } from '../../../features/organizations/components/org-console-shell';

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgConsoleShell orgId={orgId}>{children}</OrgConsoleShell>;
}

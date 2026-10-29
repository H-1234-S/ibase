import { OrganizationShell } from '../../../features/organizations/components/organization-shell';

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrganizationShell orgId={orgId}>{children}</OrganizationShell>;
}

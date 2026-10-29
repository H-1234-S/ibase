import { OrganizationDashboardPage } from '../../../../features/organizations/components/organization-dashboard-page';

export default async function Page({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrganizationDashboardPage orgId={orgId} />;
}

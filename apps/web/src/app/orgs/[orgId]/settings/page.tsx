import { OrganizationSettingsPage } from '../../../../features/organizations/components/organization-settings-page';

export default async function Page({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrganizationSettingsPage orgId={orgId} />;
}

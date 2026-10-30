import { OrgSettingsPage } from '../../../../features/organizations/components/org-settings-page';

export default async function Page({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgSettingsPage orgId={orgId} />;
}

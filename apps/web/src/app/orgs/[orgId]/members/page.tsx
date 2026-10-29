import { OrganizationMembersPage } from '../../../../features/organizations/components/organization-members-page';

export default async function Page({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrganizationMembersPage orgId={orgId} />;
}

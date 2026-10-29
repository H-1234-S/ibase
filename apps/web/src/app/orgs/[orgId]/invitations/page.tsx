import { OrganizationInvitationsPage } from '../../../../features/organizations/components/organization-invitations-page';

export default async function Page({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrganizationInvitationsPage orgId={orgId} />;
}

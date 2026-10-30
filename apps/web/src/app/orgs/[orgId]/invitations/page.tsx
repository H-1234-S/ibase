import { OrgInvitationsPage } from '../../../../features/organizations/components/org-invitations-page';

export default async function Page({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgInvitationsPage orgId={orgId} />;
}

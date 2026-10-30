import { OrgMembersPage } from '../../../../features/organizations/components/org-members-page';

export default async function Page({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgMembersPage orgId={orgId} />;
}

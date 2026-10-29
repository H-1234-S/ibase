import { OrganizationHomePage } from '../../../features/organizations/components/organization-home-page';

export default async function Page({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrganizationHomePage orgId={orgId} />;
}

import { OrgProjectsOverviewPage } from '../../../features/organizations/components/org-projects-overview-page';

export default async function Page({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgProjectsOverviewPage orgId={orgId} />;
}

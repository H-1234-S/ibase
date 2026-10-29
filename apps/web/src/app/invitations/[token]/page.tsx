import { InvitationPage } from '../../../features/organizations/components/invitation-page';

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InvitationPage token={token} />;
}

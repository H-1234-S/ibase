/** Organization roles are scoped to one organization membership. */
export type OrganizationRole = 'admin' | 'member';

export type OrganizationInvitationStatus =
  'pending' | 'accepted' | 'revoked' | 'expired';

export interface OrganizationSummary {
  id: string;
  name: string;
  currentRole: OrganizationRole;
  createdAt: string;
}

export interface OrganizationDetails extends OrganizationSummary {
  memberCount: number;
}

export interface OrganizationMember {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: OrganizationRole;
  joinedAt: string;
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: OrganizationRole;
  status: OrganizationInvitationStatus;
  expiresAt: string;
  createdAt: string;
  invitedByName: string;
}

export interface OrganizationInvitationPreview {
  organizationId: string;
  organizationName: string;
  email: string;
  role: OrganizationRole;
  status: OrganizationInvitationStatus;
  expiresAt: string;
  invitedByName: string;
}

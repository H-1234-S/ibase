import type {
  OrganizationDetails,
  OrganizationInvitation,
  OrganizationInvitationPreview,
  OrganizationMember,
  OrganizationRole,
  OrganizationSummary,
} from '@ibase/shared-types';
import { authRequest } from '../../auth/api/auth-api';

export const organizationsApi = {
  list: () => authRequest<OrganizationSummary[]>('/api/organizations'),
  create: (name: string) =>
    authRequest<OrganizationDetails>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  details: (orgId: string) =>
    authRequest<OrganizationDetails>(`/api/organizations/${orgId}`),
  members: (orgId: string) =>
    authRequest<OrganizationMember[]>(`/api/organizations/${orgId}/members`),
  updateMember: (orgId: string, membershipId: string, role: OrganizationRole) =>
    authRequest<{ membershipId: string; role: OrganizationRole }>(
      `/api/organizations/${orgId}/members/${membershipId}`,
      { method: 'PATCH', body: JSON.stringify({ role }) },
    ),
  removeMember: (orgId: string, membershipId: string) =>
    authRequest<{ removed: boolean }>(
      `/api/organizations/${orgId}/members/${membershipId}`,
      { method: 'DELETE' },
    ),
  invitations: (orgId: string) =>
    authRequest<OrganizationInvitation[]>(
      `/api/organizations/${orgId}/invitations`,
    ),
  invite: (orgId: string, email: string) =>
    authRequest<OrganizationInvitation>(
      `/api/organizations/${orgId}/invitations`,
      { method: 'POST', body: JSON.stringify({ email }) },
    ),
  resend: (orgId: string, invitationId: string) =>
    authRequest<{ sent: boolean }>(
      `/api/organizations/${orgId}/invitations/${invitationId}/resend`,
      { method: 'POST' },
    ),
  revoke: (orgId: string, invitationId: string) =>
    authRequest<{ revoked: boolean }>(
      `/api/organizations/${orgId}/invitations/${invitationId}/revoke`,
      { method: 'POST' },
    ),
  remove: (orgId: string) =>
    authRequest<{ deleted: boolean }>(`/api/organizations/${orgId}`, {
      method: 'DELETE',
    }),
  preview: (token: string) =>
    authRequest<OrganizationInvitationPreview>(`/api/invitations/${token}`),
  accept: (token: string) =>
    authRequest<{
      organizationId: string;
      membershipId: string;
      role: OrganizationRole;
      alreadyMember: boolean;
    }>(`/api/invitations/${token}/accept`, { method: 'POST' }),
};

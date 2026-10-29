export { authRefreshTokens } from './auth-refresh-tokens.js';
export { authSessions } from './auth-sessions.js';
export { users } from './users.js';
export { organizationRole, memberships } from './memberships.js';
export { organizations } from './organizations.js';
export {
  invitationStatus,
  organizationInvitations,
  organizationAuditLogs,
} from './organization-invitations.js';

import { authRefreshTokens } from './auth-refresh-tokens.js';
import { authSessions } from './auth-sessions.js';
import { users } from './users.js';
import { organizations } from './organizations.js';
import { memberships } from './memberships.js';
import {
  organizationInvitations,
  organizationAuditLogs,
} from './organization-invitations.js';

/** Drizzle schema registry for API database operations and migrations. */
export const schema = {
  users,
  authSessions,
  authRefreshTokens,
  organizations,
  memberships,
  organizationInvitations,
  organizationAuditLogs,
};

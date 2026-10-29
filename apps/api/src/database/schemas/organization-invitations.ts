import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations.js';
import { users } from './users.js';
import { organizationRole } from './memberships.js';

export const invitationStatus = pgEnum('organization_invitation_status', [
  'pending',
  'accepted',
  'revoked',
  'expired',
]);

/** An email-bound, single-use invitation. The raw token is never stored. */
export const organizationInvitations = pgTable(
  'organization_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: organizationRole('role').notNull().default('member'),
    tokenHash: text('token_hash').notNull().unique(),
    tokenCiphertext: text('token_ciphertext').notNull(),
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: invitationStatus('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('organization_invitations_pending_email_unique')
      .on(table.organizationId, table.email)
      .where(sql`status = 'pending'`),
    index('organization_invitations_org_status_expiry_idx').on(
      table.organizationId,
      table.status,
      table.expiresAt,
    ),
    index('organization_invitations_org_created_idx').on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);

/** Minimal organization audit record; it intentionally survives org deletion. */
export const organizationAuditLogs = pgTable(
  'organization_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    actorUserId: uuid('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: uuid('target_id'),
    requestId: text('request_id').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('organization_audit_org_created_idx').on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);

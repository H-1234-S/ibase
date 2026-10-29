import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { authSessions } from './auth-sessions.js';

/** Retains token hashes so reuse of any rotated token can revoke its session. */
export const authRefreshTokens = pgTable(
  'auth_refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => authSessions.id, { onDelete: 'cascade' }),
    tokenId: uuid('token_id').notNull(),
    tokenHash: text('token_hash').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    replacedAt: timestamp('replaced_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('auth_refresh_tokens_hash_unique').on(table.tokenHash),
    uniqueIndex('auth_refresh_tokens_token_id_unique').on(table.tokenId),
    index('auth_refresh_tokens_session_id_idx').on(table.sessionId),
  ],
);

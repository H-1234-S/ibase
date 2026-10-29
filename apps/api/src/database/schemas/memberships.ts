import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { users } from './users.js';

export const organizationRole = pgEnum('organization_role', [
  'admin',
  'member',
]);

/** The user's role and access grant within one organization. */
export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: organizationRole('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('memberships_org_user_unique').on(
      table.organizationId,
      table.userId,
    ),
    index('memberships_user_idx').on(table.userId),
    index('memberships_org_role_idx').on(table.organizationId, table.role),
    index('memberships_org_created_idx').on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);

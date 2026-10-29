import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NodePgTransaction } from 'drizzle-orm/node-postgres';
import type { PublicUser } from '@ibase/shared-types';
import { DatabaseService } from '../database/database.service.js';
import {
  schema,
  memberships,
  organizationAuditLogs,
} from '../database/schemas/index.js';
import { OrganizationError } from './errors/organization-error.js';

type OrganizationTransaction = NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/** Performs organization authorization checks and transactional audit writes. */
@Injectable()
export class OrganizationAccessService {
  constructor(private readonly database: DatabaseService) {}

  async requireMember(userId: string, orgId: string) {
    const membership = await this.database.db.query.memberships.findFirst({
      where: and(
        eq(memberships.organizationId, orgId),
        eq(memberships.userId, userId),
      ),
    });
    if (!membership) this.notFound();
    return membership!;
  }

  async requireAdmin(userId: string, orgId: string) {
    const membership = await this.requireMember(userId, orgId);
    if (membership.role !== 'admin') {
      throw new OrganizationError(
        'ORG_ADMIN_REQUIRED',
        'Organization admin access is required',
        403,
      );
    }
    return membership;
  }

  async lockOrganization(
    tx: OrganizationTransaction,
    actorId: string,
    orgId: string,
  ) {
    const locked = await tx.execute(
      sql`SELECT id FROM organizations WHERE id = ${orgId} FOR UPDATE`,
    );
    if (!locked.rows.length) this.notFound();
    const actor = await tx.query.memberships.findFirst({
      where: and(
        eq(memberships.organizationId, orgId),
        eq(memberships.userId, actorId),
      ),
    });
    if (!actor) this.notFound();
    if (actor.role !== 'admin') {
      throw new OrganizationError(
        'ORG_ADMIN_REQUIRED',
        'Organization admin access is required',
        403,
      );
    }
  }

  async requireOtherAdmin(
    tx: OrganizationTransaction,
    orgId: string,
    excludedMembershipId: string,
  ) {
    const others = await tx
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.organizationId, orgId),
          eq(memberships.role, 'admin'),
          sql`${memberships.id} <> ${excludedMembershipId}`,
        ),
      )
      .limit(1);
    if (!others.length) {
      throw new OrganizationError(
        'LAST_ADMIN_REQUIRED',
        'The organization must retain at least one admin',
        409,
      );
    }
  }

  async audit(
    tx: OrganizationTransaction,
    organizationId: string,
    actorUserId: PublicUser['id'] | null,
    action: string,
    targetType: string,
    targetId: string,
    metadata: Record<string, unknown> = {},
  ) {
    await tx.insert(organizationAuditLogs).values({
      organizationId,
      actorUserId,
      action,
      targetType,
      targetId,
      requestId: randomUUID(),
      metadata,
    });
  }

  notFound(): never {
    throw new OrganizationError(
      'ORGANIZATION_NOT_FOUND',
      'Organization was not found',
      404,
    );
  }
}

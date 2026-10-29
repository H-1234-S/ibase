import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { OrganizationRole, PublicUser } from '@ibase/shared-types';
import { DatabaseService } from '../database/database.service.js';
import {
  memberships,
  organizations,
  users,
} from '../database/schemas/index.js';
import { OrganizationError } from './errors/organization-error.js';
import { OrganizationAccessService } from './organization-access.service.js';

/** Creates organizations and reads the caller's organization workspace. */
@Injectable()
export class OrganizationsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly access: OrganizationAccessService,
  ) {}

  async create(user: PublicUser, inputName: string) {
    if (!user.emailVerifiedAt) {
      throw new OrganizationError(
        'EMAIL_VERIFICATION_REQUIRED',
        'Verify your email before creating an organization',
        403,
      );
    }
    const name = inputName.trim();
    const hasControlCharacters = name.split('').some((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    });
    if (!name || name.length > 80 || hasControlCharacters) {
      throw new OrganizationError(
        'ORGANIZATION_NAME_INVALID',
        'Organization name must contain 1 to 80 characters',
        400,
      );
    }

    return this.database.db.transaction(async (tx) => {
      const [organization] = await tx
        .insert(organizations)
        .values({ name, createdBy: user.id })
        .returning();
      const [membership] = await tx
        .insert(memberships)
        .values({
          organizationId: organization!.id,
          userId: user.id,
          role: 'admin',
        })
        .returning();
      await this.access.audit(
        tx,
        organization!.id,
        user.id,
        'organization.created',
        'organization',
        organization!.id,
      );
      return {
        id: organization!.id,
        name: organization!.name,
        currentRole: membership!.role,
        createdAt: organization!.createdAt.toISOString(),
        memberCount: 1,
      };
    });
  }

  async list(user: PublicUser) {
    const rows = await this.database.db
      .select({
        id: organizations.id,
        name: organizations.name,
        role: memberships.role,
        createdAt: organizations.createdAt,
      })
      .from(memberships)
      .innerJoin(
        organizations,
        eq(memberships.organizationId, organizations.id),
      )
      .where(eq(memberships.userId, user.id))
      .orderBy(desc(organizations.createdAt), organizations.id);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      currentRole: row.role,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async details(user: PublicUser, orgId: string) {
    const membership = await this.access.requireMember(user.id, orgId);
    const [organization, counts] = await Promise.all([
      this.database.db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
      }),
      this.database.db
        .select({ count: sql<number>`count(*)::int` })
        .from(memberships)
        .where(eq(memberships.organizationId, orgId)),
    ]);
    if (!organization) this.access.notFound();
    return {
      id: organization.id,
      name: organization.name,
      currentRole: membership.role,
      createdAt: organization.createdAt.toISOString(),
      memberCount: counts[0]!.count,
    };
  }

  async deleteOrganization(actor: PublicUser, orgId: string) {
    return this.database.db.transaction(async (tx) => {
      await this.access.lockOrganization(tx, actor.id, orgId);
      await this.access.audit(
        tx,
        orgId,
        actor.id,
        'organization.deleted',
        'organization',
        orgId,
      );
      await tx.delete(organizations).where(eq(organizations.id, orgId));
      return { deleted: true };
    });
  }

  async listMembers(user: PublicUser, orgId: string) {
    await this.access.requireMember(user.id, orgId);
    const rows = await this.database.db
      .select({
        membershipId: memberships.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        role: memberships.role,
        joinedAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.organizationId, orgId))
      .orderBy(memberships.createdAt, memberships.id);
    return rows.map((row) => ({
      ...row,
      joinedAt: row.joinedAt.toISOString(),
    }));
  }

  async updateMember(
    actor: PublicUser,
    orgId: string,
    membershipId: string,
    role: OrganizationRole,
  ) {
    return this.database.db.transaction(async (tx) => {
      await this.access.lockOrganization(tx, actor.id, orgId);
      const target = await tx.query.memberships.findFirst({
        where: and(
          eq(memberships.id, membershipId),
          eq(memberships.organizationId, orgId),
        ),
      });
      if (!target) this.membershipNotFound();
      if (target.role === 'admin' && role !== 'admin') {
        await this.access.requireOtherAdmin(tx, orgId, target.id);
      }
      const [updated] = await tx
        .update(memberships)
        .set({ role, updatedAt: new Date() })
        .where(eq(memberships.id, membershipId))
        .returning();
      await this.access.audit(
        tx,
        orgId,
        actor.id,
        'membership.role_changed',
        'membership',
        membershipId,
        { role },
      );
      return { membershipId: updated!.id, role: updated!.role };
    });
  }

  async removeMember(actor: PublicUser, orgId: string, membershipId: string) {
    return this.database.db.transaction(async (tx) => {
      await this.access.lockOrganization(tx, actor.id, orgId);
      const target = await tx.query.memberships.findFirst({
        where: and(
          eq(memberships.id, membershipId),
          eq(memberships.organizationId, orgId),
        ),
      });
      if (!target) this.membershipNotFound();
      if (target.role === 'admin')
        await this.access.requireOtherAdmin(tx, orgId, target.id);
      await tx.delete(memberships).where(eq(memberships.id, membershipId));
      await this.access.audit(
        tx,
        orgId,
        actor.id,
        'membership.removed',
        'membership',
        membershipId,
      );
      return { removed: true };
    });
  }

  private membershipNotFound(): never {
    throw new OrganizationError(
      'MEMBERSHIP_NOT_FOUND',
      'Membership was not found',
      404,
    );
  }
}

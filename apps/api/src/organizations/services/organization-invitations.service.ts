import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, desc, eq, lte, sql } from 'drizzle-orm';
import type {
  OrganizationInvitationStatus,
  OrganizationRole,
  PublicUser,
} from '@ibase/shared-types';
import { DatabaseService } from '../../database/database.service.js';
import {
  memberships,
  organizationInvitations,
  organizations,
  users,
} from '../../database/schemas/index.js';
import { EmailService } from '../../auth/services/email.service.js';
import { OrganizationError } from '../errors/organization-error.js';
import { OrganizationAccessService } from './organization-access.service.js';
import { OrganizationInvitationSecurityService } from './organization-invitation-security.service.js';

/** Creates and revokes organization invitations. */
@Injectable()
export class OrganizationInvitationsService {
  private readonly invitationTtlHours: number;

  constructor(
    private readonly database: DatabaseService,
    private readonly config: ConfigService,
    private readonly access: OrganizationAccessService,
    private readonly security: OrganizationInvitationSecurityService,
    private readonly emailService: EmailService,
  ) {
    this.invitationTtlHours = config.getOrThrow<number>('INVITATION_TTL_HOURS');
  }

  async create(actor: PublicUser, orgId: string, rawEmail: string, ip: string) {
    await this.access.requireAdmin(actor.id, orgId);
    const email = rawEmail.trim().toLowerCase();
    await Promise.all([
      this.security.limit(`create:org:${orgId}`, 20, 3600),
      this.security.limit(`create:email:${email}`, 5, 3600),
      this.security.limit(`create:ip:${ip}`, 30, 3600),
    ]);
    const now = new Date();
    const { token, tokenHash, tokenCiphertext } = this.security.create();
    const expiresAt = new Date(
      now.getTime() + this.invitationTtlHours * 3600_000,
    );
    const invitation = await this.database.db.transaction(async (tx) => {
      await this.access.lockOrganization(tx, actor.id, orgId);
      const existingMember = await tx
        .select({ id: memberships.id })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(
          and(eq(memberships.organizationId, orgId), eq(users.email, email)),
        );
      if (existingMember.length) {
        throw new OrganizationError(
          'ALREADY_ORGANIZATION_MEMBER',
          'This email already belongs to the organization',
          409,
        );
      }
      await tx
        .update(organizationInvitations)
        .set({ status: 'expired', updatedAt: now })
        .where(
          and(
            eq(organizationInvitations.organizationId, orgId),
            eq(organizationInvitations.status, 'pending'),
            lte(organizationInvitations.expiresAt, now),
          ),
        );
      const pending = await tx.query.organizationInvitations.findFirst({
        where: and(
          eq(organizationInvitations.organizationId, orgId),
          eq(organizationInvitations.email, email),
          eq(organizationInvitations.status, 'pending'),
        ),
      });
      if (pending) {
        throw new OrganizationError(
          'INVITATION_ALREADY_PENDING',
          'A pending invitation already exists; resend it instead',
          409,
        );
      }
      const inserted = await tx
        .insert(organizationInvitations)
        .values({
          organizationId: orgId,
          email,
          role: 'member',
          tokenHash,
          tokenCiphertext,
          invitedBy: actor.id,
          expiresAt,
        })
        .returning();
      await this.access.audit(
        tx,
        orgId,
        actor.id,
        'invitation.created',
        'invitation',
        inserted[0]!.id,
      );
      const organization = await tx.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
      });
      if (!organization) this.access.notFound();
      try {
        await this.emailService.sendOrganizationInvitation(
          email,
          organization.name,
          actor.name,
          `${this.config.getOrThrow<string>('WEB_ORIGIN')}/invitations/${token}`,
          this.invitationTtlHours,
        );
        return { invitation: inserted[0]!, deliveryFailed: false };
      } catch {
        const failedAt = new Date();
        await tx
          .update(organizationInvitations)
          .set({ status: 'revoked', revokedAt: failedAt, updatedAt: failedAt })
          .where(eq(organizationInvitations.id, inserted[0]!.id));
        await this.access.audit(
          tx,
          orgId,
          actor.id,
          'invitation.delivery_failed',
          'invitation',
          inserted[0]!.id,
        );
        return { invitation: inserted[0]!, deliveryFailed: true };
      }
    });
    if (invitation.deliveryFailed) {
      throw new OrganizationError(
        'INVITATION_EMAIL_SEND_FAILED',
        'The invitation email could not be sent',
        503,
      );
    }
    return this.view(invitation.invitation, actor.name);
  }

  async resend(actor: PublicUser, orgId: string, id: string, ip: string) {
    await this.access.requireAdmin(actor.id, orgId);
    const [initial] = await this.database.db
      .select({ email: organizationInvitations.email })
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.id, id),
          eq(organizationInvitations.organizationId, orgId),
          eq(organizationInvitations.status, 'pending'),
        ),
      );
    if (!initial) {
      throw new OrganizationError(
        'INVITATION_NOT_FOUND',
        'Invitation was not found',
        404,
      );
    }
    await Promise.all([
      this.security.limit(`resend:org:${orgId}`, 20, 3600),
      this.security.limit(`resend:email:${initial.email}`, 5, 3600),
      this.security.limit(`resend:ip:${ip}`, 30, 3600),
    ]);
    return this.database.db.transaction(async (tx) => {
      await this.access.lockOrganization(tx, actor.id, orgId);
      const [invitation] = await tx
        .select()
        .from(organizationInvitations)
        .where(
          and(
            eq(organizationInvitations.id, id),
            eq(organizationInvitations.organizationId, orgId),
            eq(organizationInvitations.status, 'pending'),
          ),
        )
        .for('update');
      if (!invitation) {
        throw new OrganizationError(
          'INVITATION_NOT_FOUND',
          'Invitation was not found',
          404,
        );
      }
      if (invitation.expiresAt <= new Date()) {
        throw new OrganizationError(
          'INVITATION_EXPIRED',
          'Invitation has expired; create a new invitation',
          410,
        );
      }
      const organization = await tx.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
      });
      if (!organization) this.access.notFound();
      try {
        await this.emailService.sendOrganizationInvitation(
          invitation.email,
          organization.name,
          actor.name,
          `${this.config.getOrThrow<string>('WEB_ORIGIN')}/invitations/${this.security.decrypt(invitation.tokenCiphertext)}`,
          this.invitationTtlHours,
        );
      } catch {
        throw new OrganizationError(
          'INVITATION_EMAIL_SEND_FAILED',
          'The invitation email could not be sent',
          503,
        );
      }
      await this.access.audit(
        tx,
        orgId,
        actor.id,
        'invitation.resent',
        'invitation',
        id,
      );
      return { sent: true, expiresAt: invitation.expiresAt.toISOString() };
    });
  }

  async list(
    actor: PublicUser,
    orgId: string,
    status?: OrganizationInvitationStatus,
    limit = 50,
    offset = 0,
  ) {
    await this.access.requireAdmin(actor.id, orgId);
    if (
      status &&
      !['pending', 'accepted', 'revoked', 'expired'].includes(status)
    ) {
      throw new OrganizationError(
        'INVITATION_STATUS_INVALID',
        'Invitation status is invalid',
        400,
      );
    }
    const where = status
      ? and(
          eq(organizationInvitations.organizationId, orgId),
          eq(organizationInvitations.status, status),
        )
      : eq(organizationInvitations.organizationId, orgId);
    const rows = await this.database.db
      .select({
        invitation: organizationInvitations,
        invitedByName: users.name,
      })
      .from(organizationInvitations)
      .innerJoin(users, eq(users.id, organizationInvitations.invitedBy))
      .where(where)
      .orderBy(
        desc(organizationInvitations.createdAt),
        organizationInvitations.id,
      )
      .limit(limit)
      .offset(offset);
    const now = new Date();
    return rows.map(({ invitation, invitedByName }) =>
      this.view(
        {
          ...invitation,
          status:
            invitation.status === 'pending' && invitation.expiresAt <= now
              ? 'expired'
              : invitation.status,
        },
        invitedByName,
      ),
    );
  }

  async preview(rawToken: string, ip: string) {
    await this.security.limit(`preview:${ip}`, 120, 3600);
    const [row] = await this.database.db
      .select({
        invitation: organizationInvitations,
        organizationName: organizations.name,
        invitedByName: users.name,
      })
      .from(organizationInvitations)
      .innerJoin(
        organizations,
        eq(organizations.id, organizationInvitations.organizationId),
      )
      .innerJoin(users, eq(users.id, organizationInvitations.invitedBy))
      .where(
        eq(organizationInvitations.tokenHash, this.security.hash(rawToken)),
      );
    if (!row) this.invitationNotFound();
    const status =
      row.invitation.status === 'pending' &&
      row.invitation.expiresAt <= new Date()
        ? 'expired'
        : row.invitation.status;
    return {
      organizationId: row.invitation.organizationId,
      organizationName: row.organizationName,
      email: row.invitation.email,
      role: row.invitation.role as OrganizationRole,
      status,
      expiresAt: row.invitation.expiresAt.toISOString(),
      invitedByName: row.invitedByName,
    };
  }

  async accept(user: PublicUser, rawToken: string, ip: string) {
    await Promise.all([
      this.security.limit(`accept:user:${user.id}`, 20, 3600),
      this.security.limit(`accept:ip:${ip}`, 60, 3600),
    ]);
    const tokenHash = this.security.hash(rawToken);
    return this.database.db.transaction(async (tx) => {
      const locked = await tx.execute(
        sql`SELECT id FROM organization_invitations WHERE token_hash = ${tokenHash} FOR UPDATE`,
      );
      if (!locked.rows.length) this.invitationNotFound();
      const invitation = await tx.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.tokenHash, tokenHash),
      });
      if (!invitation) this.invitationNotFound();
      const [account] = await tx
        .select()
        .from(users)
        .where(eq(users.id, user.id));
      if (!account?.emailVerifiedAt) {
        throw new OrganizationError(
          'EMAIL_VERIFICATION_REQUIRED',
          'Verify your email before accepting an invitation',
          403,
        );
      }
      if (account.email.trim().toLowerCase() !== invitation.email) {
        throw new OrganizationError(
          'INVITATION_EMAIL_MISMATCH',
          'Sign in with the email address this invitation was sent to',
          403,
        );
      }
      const member = await tx.query.memberships.findFirst({
        where: and(
          eq(memberships.organizationId, invitation.organizationId),
          eq(memberships.userId, user.id),
        ),
      });
      if (invitation.status === 'accepted') {
        if (!member)
          throw new OrganizationError(
            'INVITATION_ALREADY_ACCEPTED',
            'Invitation has already been used',
            409,
          );
        return {
          organizationId: invitation.organizationId,
          membershipId: member.id,
          role: member.role,
          alreadyMember: true,
        };
      }
      if (invitation.status === 'revoked') {
        throw new OrganizationError(
          'INVITATION_REVOKED',
          'Invitation has been revoked',
          410,
        );
      }
      if (
        invitation.status !== 'pending' ||
        invitation.expiresAt <= new Date()
      ) {
        throw new OrganizationError(
          'INVITATION_EXPIRED',
          'Invitation has expired',
          410,
        );
      }
      const [createdMember] = member
        ? [member]
        : await tx
            .insert(memberships)
            .values({
              organizationId: invitation.organizationId,
              userId: user.id,
              role: 'member',
            })
            .returning();
      await tx
        .update(organizationInvitations)
        .set({
          status: 'accepted',
          acceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(organizationInvitations.id, invitation.id));
      await this.access.audit(
        tx,
        invitation.organizationId,
        user.id,
        'invitation.accepted',
        'invitation',
        invitation.id,
      );
      return {
        organizationId: invitation.organizationId,
        membershipId: createdMember!.id,
        role: createdMember!.role,
        alreadyMember: false,
      };
    });
  }

  view(
    invitation: typeof organizationInvitations.$inferSelect,
    invitedByName: string,
  ) {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role as OrganizationRole,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
      invitedByName,
    };
  }

  private invitationNotFound(): never {
    throw new OrganizationError(
      'INVITATION_NOT_FOUND',
      'Invitation was not found',
      404,
    );
  }

  async revoke(actor: PublicUser, orgId: string, id: string) {
    return this.database.db.transaction(async (tx) => {
      await this.access.lockOrganization(tx, actor.id, orgId);
      const [revoked] = await tx
        .update(organizationInvitations)
        .set({
          status: 'revoked',
          revokedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(organizationInvitations.id, id),
            eq(organizationInvitations.organizationId, orgId),
            eq(organizationInvitations.status, 'pending'),
          ),
        )
        .returning();
      if (!revoked) {
        throw new OrganizationError(
          'INVITATION_NOT_FOUND',
          'Pending invitation was not found',
          404,
        );
      }
      await this.access.audit(
        tx,
        orgId,
        actor.id,
        'invitation.revoked',
        'invitation',
        id,
      );
      return { revoked: true };
    });
  }
}

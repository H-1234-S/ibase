import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { RedisModule } from '../redis/redis.module.js';
import {
  InvitationController,
  OrganizationsController,
} from './organizations.controller.js';
import { OrganizationAccessService } from './organization-access.service.js';
import { OrganizationInvitationSecurityService } from './organization-invitation-security.service.js';
import { OrganizationInvitationsService } from './organization-invitations.service.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  imports: [AuthModule, DatabaseModule, RedisModule],
  controllers: [OrganizationsController, InvitationController],
  providers: [
    OrganizationAccessService,
    OrganizationInvitationSecurityService,
    OrganizationInvitationsService,
    OrganizationsService,
  ],
})
export class OrganizationsModule {}

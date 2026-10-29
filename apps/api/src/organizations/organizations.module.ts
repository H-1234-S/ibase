import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { RedisModule } from '../redis/redis.module.js';
import {
  InvitationController,
  OrganizationsController,
} from './controllers/organizations.controller.js';
import { OrganizationAccessService } from './services/organization-access.service.js';
import { OrganizationInvitationSecurityService } from './services/organization-invitation-security.service.js';
import { OrganizationInvitationsService } from './services/organization-invitations.service.js';
import { OrganizationsService } from './services/organizations.service.js';

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

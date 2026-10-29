import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  PublicUser,
  OrganizationInvitationStatus,
} from '@ibase/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthOriginGuard } from '../auth/guards/auth-origin.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  CreateInvitationDto,
  CreateOrganizationDto,
  UpdateMembershipDto,
} from './dto/organization.dto.js';
import { OrganizationInvitationsService } from './organization-invitations.service.js';
import { OrganizationsService } from './organizations.service.js';

/** Authenticated organization, member and invitation management endpoints. */
@Controller('organizations')
@UseGuards(AuthOriginGuard, JwtAuthGuard)
export class OrganizationsController {
  constructor(
    private readonly organizations: OrganizationsService,
    private readonly invitationsService: OrganizationInvitationsService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: PublicUser,
    @Body() input: CreateOrganizationDto,
  ) {
    return { data: await this.organizations.create(user, input.name) };
  }

  @Get()
  async list(@CurrentUser() user: PublicUser) {
    return { data: await this.organizations.list(user) };
  }

  @Get(':orgId')
  async details(
    @CurrentUser() user: PublicUser,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    return { data: await this.organizations.details(user, orgId) };
  }

  @Delete(':orgId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    return { data: await this.organizations.deleteOrganization(user, orgId) };
  }

  @Get(':orgId/members')
  async members(
    @CurrentUser() user: PublicUser,
    @Param('orgId', ParseUUIDPipe) orgId: string,
  ) {
    return { data: await this.organizations.listMembers(user, orgId) };
  }

  @Patch(':orgId/members/:membershipId')
  async updateMember(
    @CurrentUser() user: PublicUser,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() input: UpdateMembershipDto,
  ) {
    return {
      data: await this.organizations.updateMember(
        user,
        orgId,
        membershipId,
        input.role,
      ),
    };
  }

  @Delete(':orgId/members/:membershipId')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @CurrentUser() user: PublicUser,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ) {
    return {
      data: await this.organizations.removeMember(user, orgId, membershipId),
    };
  }

  @Post(':orgId/invitations')
  async invite(
    @CurrentUser() user: PublicUser,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() input: CreateInvitationDto,
    @Ip() ip: string,
  ) {
    return {
      data: await this.invitationsService.create(user, orgId, input.email, ip),
    };
  }

  @Get(':orgId/invitations')
  async invitations(
    @CurrentUser() user: PublicUser,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('status') status?: OrganizationInvitationStatus,
  ) {
    return {
      data: await this.invitationsService.list(user, orgId, status),
    };
  }

  @Post(':orgId/invitations/:invitationId/resend')
  async resend(
    @CurrentUser() user: PublicUser,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @Ip() ip: string,
  ) {
    return {
      data: await this.invitationsService.resend(user, orgId, invitationId, ip),
    };
  }

  @Post(':orgId/invitations/:invitationId/revoke')
  async revoke(
    @CurrentUser() user: PublicUser,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    return {
      data: await this.invitationsService.revoke(user, orgId, invitationId),
    };
  }
}

/** Public invite preview and authenticated email-bound acceptance endpoints. */
@Controller('invitations')
@UseGuards(AuthOriginGuard)
export class InvitationController {
  constructor(private readonly invitations: OrganizationInvitationsService) {}

  @Get(':token')
  async preview(@Param('token') token: string, @Ip() ip: string) {
    return { data: await this.invitations.preview(token, ip) };
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  async accept(
    @CurrentUser() user: PublicUser,
    @Param('token') token: string,
    @Ip() ip: string,
  ) {
    return { data: await this.invitations.accept(user, token, ip) };
  }
}

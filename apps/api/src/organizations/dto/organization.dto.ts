import { IsEmail, IsIn, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateOrganizationDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(80)
  name!: string;
}

export class CreateInvitationDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class UpdateMembershipDto {
  @IsIn(['admin', 'member'])
  role!: 'admin' | 'member';
}

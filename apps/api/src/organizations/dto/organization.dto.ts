import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
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

/** Bounds list queries while preserving the existing array response shape. */
export class OrganizationListQueryDto {
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  offset?: number;

  @IsOptional()
  @IsIn(['pending', 'accepted', 'revoked', 'expired'])
  status?: 'pending' | 'accepted' | 'revoked' | 'expired';
}

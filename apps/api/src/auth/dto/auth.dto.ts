import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Email address used to request a registration verification code. */
export class SendEmailCodeDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

/** New account fields required to register and establish a session. */
export class RegisterDto extends SendEmailCodeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  password!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

/** Credentials for email and password authentication. */
export class LoginDto extends SendEmailCodeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

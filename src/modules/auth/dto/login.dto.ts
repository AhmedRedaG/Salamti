import {
  IsEmail,
  IsJWT,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

class LoginDto {
  @IsUUID()
  deviceId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  deviceToken?: string;
}

// Normal Auth

export class AuthLoginDto extends LoginDto {
  @IsEmail()
  email!: string;

  @IsStrongPassword()
  @Length(8, 256)
  password!: string;
}

// Google Auth

export class GoogleLoginDto extends LoginDto {
  @IsJWT()
  googleToken!: string;
}

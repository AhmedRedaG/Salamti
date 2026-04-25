import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsJWT,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { BloodType, CurrentRoles } from '../../../../generated/prisma/enums';
import { Transform } from 'class-transformer';
import appConfig from '../../../config/app.config';

const phoneConfig = appConfig().phone;
const PHONE_REGEX = phoneConfig.regex;
const PHONE_MESSAGE = phoneConfig.message;

export class CreateUserDto {
  @IsOptional() // to drop it after role selection
  @IsEnum(CurrentRoles)
  role?: CurrentRoles;

  @IsString()
  @Length(1, 100)
  fullName!: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  phone!: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  // for normal auth
  @IsOptional()
  @IsString()
  @Length(8, 255)
  passwordHash?: string;

  // for google auth
  @IsOptional()
  @IsJWT()
  googleId?: string;

  // for driver
  @IsOptional()
  @IsNumber()
  @Min(16)
  @Max(100)
  age?: number;

  // for driver
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  // for paramedic
  @IsOptional()
  @IsString()
  @Length(1, 256)
  employeeId?: string;
}

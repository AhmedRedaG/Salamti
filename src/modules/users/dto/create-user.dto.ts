import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsJWT,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { BloodType, CurrentRoles } from '../../../../generated/prisma/enums';

export class CreateUserDto {
  @IsOptional() // to drop it after role selection
  @IsEnum(CurrentRoles)
  role?: CurrentRoles;

  @IsString()
  @Length(1, 100)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsPhoneNumber()
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

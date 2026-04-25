import {
  IsEmail,
  IsEnum,
  IsJWT,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { BloodType, CurrentRoles } from '../../../../generated/prisma/enums';
import { IntersectionType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import appConfig from '../../../config/app.config';

const phoneConfig = appConfig().phone;
const PHONE_REGEX = phoneConfig.regex;
const PHONE_MESSAGE = phoneConfig.message;

class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  phone!: string;
}

class RegisterDriverDto extends RegisterDto {
  role = CurrentRoles.DRIVER;

  @IsNotEmpty()
  @IsNumber()
  @Min(16)
  age!: number;

  @IsEnum(BloodType)
  bloodType!: BloodType;
}

class RegisterParamedicDto extends RegisterDto {
  role = CurrentRoles.PARAMEDIC;

  @IsNotEmpty()
  @IsString()
  @Length(1, 256)
  employeeId!: string;
}

// Normal Auth

class NormalAuthDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 256)
  fullName!: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email!: string;

  @IsStrongPassword()
  @Length(8, 256)
  password!: string;
}

export class AuthRegisterDriverDto extends IntersectionType(
  NormalAuthDto,
  RegisterDriverDto,
) {}

export class AuthRegisterParamedicDto extends IntersectionType(
  NormalAuthDto,
  RegisterParamedicDto,
) {}

// Google Auth

class GoogleAuthDto {
  @IsJWT()
  googleToken!: string;
}

export class GoogleRegisterDriverDto extends IntersectionType(
  GoogleAuthDto,
  RegisterDriverDto,
) {}

export class GoogleRegisterParamedicDto extends IntersectionType(
  GoogleAuthDto,
  RegisterParamedicDto,
) {}

import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Relationship } from '../../../../generated/prisma/enums';
import { Transform } from 'class-transformer';
import appConfig from '../../../config/app.config';

const phoneConfig = appConfig().phone;
const PHONE_REGEX = phoneConfig.regex;
const PHONE_MESSAGE = phoneConfig.message;

export class CreateEmergencyContactDto {
  @IsString()
  @Length(1, 150)
  fullName!: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  phone!: string;

  @IsEnum(Relationship)
  relationship!: Relationship;

  @IsOptional()
  @IsBoolean()
  autoNotify?: boolean;

  @IsOptional()
  @IsBoolean()
  instantSms?: boolean;

  @IsOptional()
  @IsBoolean()
  voiceCall?: boolean;
}

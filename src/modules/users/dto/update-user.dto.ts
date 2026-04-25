import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import appConfig from '../../../config/app.config';

const phoneConfig = appConfig().phone;
const PHONE_REGEX = phoneConfig.regex;
const PHONE_MESSAGE = phoneConfig.message;

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  phone?: string;
}

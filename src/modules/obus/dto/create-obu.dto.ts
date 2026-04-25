import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import appConfig from '../../../config/app.config';

const phoneConfig = appConfig().phone;
const PHONE_REGEX = phoneConfig.regex;
const PHONE_MESSAGE = phoneConfig.message;

export class CreateObuDto {
  @IsString()
  @Length(1, 50)
  name!: string;

  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value.toUpperCase().trim())
  instNumber!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  simCardNumber!: string;

  @IsString()
  @Length(1, 50)
  version!: string;
}

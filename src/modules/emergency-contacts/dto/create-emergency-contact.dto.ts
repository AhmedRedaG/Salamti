import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';
import { Relationship } from '../../../../generated/prisma/enums';
import { Transform } from 'class-transformer';

export class CreateEmergencyContactDto {
  @IsString()
  @Length(1, 150)
  fullName!: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email!: string;

  @IsPhoneNumber()
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

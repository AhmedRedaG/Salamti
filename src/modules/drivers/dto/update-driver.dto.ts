import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { BloodType } from '../../../../generated/prisma/enums';

export class UpdateDriverDto {
  @IsOptional()
  @IsNumber()
  @Min(16)
  @Max(100)
  age?: number;

  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @IsOptional()
  @IsObject()
  medicalConditions?: Record<string, any[] | any>;
}

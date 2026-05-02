import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AccidentType } from '../../../../generated/prisma/enums';

export class CreateAccidentDto {
  @IsEnum(AccidentType)
  type!: AccidentType;

  @IsString()
  obuInst!: string;

  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  @IsOptional()
  @IsNumber()
  peakG?: number;

  @IsOptional()
  @IsNumber()
  gyroX?: number;

  @IsOptional()
  @IsNumber()
  gyroY?: number;
}

import { IsEnum, IsLatitude, IsLongitude, IsOptional } from 'class-validator';
import { ParamedicStatus } from '../../../../generated/prisma/enums';

export class ParamedicsLocationFindOptionsQueryFilter {
  @IsLongitude()
  gpsLongitude!: number;

  @IsLatitude()
  gpsLatitude!: number;

  @IsOptional()
  @IsEnum(ParamedicStatus)
  status?: ParamedicStatus;
}

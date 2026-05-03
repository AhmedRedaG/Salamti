import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsUUID,
} from 'class-validator';
import {
  AccidentLevel,
  AccidentStatus,
  AccidentType,
} from '../../../../generated/prisma/enums';
import { OrderDirection } from '../../../common/filters/main-find-options-query.filter';

export class AccidentsFindOptionsQueryFilter {
  @IsOptional()
  @IsEnum(OrderDirection)
  orderDirection: OrderDirection = OrderDirection.DESC;

  @IsOptional()
  @IsLongitude()
  gpsLongitude?: number;

  @IsOptional()
  @IsLatitude()
  gpsLatitude?: number;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  obuId?: string;

  @IsOptional()
  @IsEnum(AccidentStatus)
  status?: AccidentStatus;

  @IsOptional()
  @IsEnum(AccidentType)
  type?: AccidentType;

  @IsOptional()
  @IsEnum(AccidentLevel)
  level?: AccidentLevel;
}

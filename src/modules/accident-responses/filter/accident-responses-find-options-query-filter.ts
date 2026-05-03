import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { OrderDirection } from '../../../common/filters/main-find-options-query.filter';
import {
  PatientStatus,
  ResponseStatus,
} from '../../../../generated/prisma/enums';

export class AccidentResponsesFindOptionsQueryFilter {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  orderBy: string = 'dispatchedAt';

  @IsOptional()
  @IsEnum(OrderDirection)
  orderDirection: OrderDirection = OrderDirection.DESC;

  @IsOptional()
  @IsUUID()
  accidentId?: string;

  @IsOptional()
  @IsUUID()
  paramedicId?: string;

  @IsOptional()
  @IsEnum(ResponseStatus)
  responseStatus?: ResponseStatus;

  @IsOptional()
  @IsEnum(PatientStatus)
  patientStatus?: PatientStatus;
}

import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MainFindOptionsQueryFilter } from '../../../common/filters/main-find-options-query.filter';
import { ObuStatus } from '../../../../generated/prisma/enums';
import { Transform } from 'class-transformer';

export class ObusFindOptionsQueryFilter extends MainFindOptionsQueryFilter {
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsEnum(ObuStatus)
  status?: ObuStatus;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }): string | boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isValid?: boolean;
}

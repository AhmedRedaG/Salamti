import { IsOptional, IsUUID } from 'class-validator';
import { MainFindOptionsQueryFilter } from '../../../common/filters/main-find-options-query.filter';

export class VehiclesFindOptionsQueryFilter extends MainFindOptionsQueryFilter {
  @IsOptional()
  @IsUUID()
  driverId?: string;
}

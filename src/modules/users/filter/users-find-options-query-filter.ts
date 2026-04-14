import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { MainFindOptionsQueryFilter } from '../../../common/filters/main-find-options-query.filter';
import { Transform } from 'class-transformer';

export class UserFindOptionsQueryFilter extends MainFindOptionsQueryFilter {
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }): string | boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isVerified?: boolean;
}

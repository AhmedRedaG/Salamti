import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import appConfig from '../../config/app.config';

const { defaultPage, defaultLimit, maxLimit } = appConfig().pagination;

export class PaginationQueryFilter {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = defaultPage;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(maxLimit)
  @Type(() => Number)
  limit: number = defaultLimit;
}

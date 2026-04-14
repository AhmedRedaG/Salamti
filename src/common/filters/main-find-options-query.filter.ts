import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class MainFindOptionsQueryFilter {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }): string | boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  orderBy: string = 'createdAt';

  @IsOptional()
  @IsEnum(OrderDirection)
  orderDirection: OrderDirection = OrderDirection.DESC;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;
}

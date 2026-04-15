import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MainFindOptionsQueryFilter } from '../../../common/filters/main-find-options-query.filter';
import { Relationship } from '../../../../generated/prisma/enums';
import { Transform } from 'class-transformer';

export class EmergencyContactFindOptionsQueryFilter extends MainFindOptionsQueryFilter {
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsEnum(Relationship)
  relationship?: Relationship;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }): string | boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  autoNotify?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }): string | boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  instantSms?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }): string | boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  voiceCall?: boolean;
}

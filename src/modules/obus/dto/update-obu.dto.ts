import { PartialType } from '@nestjs/mapped-types';
import { CreateObuDto } from './create-obu.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ObuStatus } from '../../../../generated/prisma/enums';

export class UpdateObuDto extends PartialType(CreateObuDto) {
  @IsOptional()
  @IsEnum(ObuStatus)
  status?: ObuStatus;
}

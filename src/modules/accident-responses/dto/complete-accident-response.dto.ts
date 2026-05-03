import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PatientStatus } from '../../../../generated/prisma/enums';

export class CompleteAccidentResponseDto {
  @IsEnum(PatientStatus)
  patientStatus!: PatientStatus;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  paramedicObservations?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  transportingToHospital?: string;
}

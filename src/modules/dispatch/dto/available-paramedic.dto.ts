import { IsLatitude, IsLongitude } from 'class-validator';

export class ParamedicLocationDto {
  @IsLongitude()
  longitude!: number;

  @IsLatitude()
  latitude!: number;
}

import { IsLatitude, IsLongitude } from 'class-validator';

export class ParamedicLocationDto {
  @IsLongitude()
  gpsLongitude!: number;

  @IsLatitude()
  gpsLatitude!: number;
}

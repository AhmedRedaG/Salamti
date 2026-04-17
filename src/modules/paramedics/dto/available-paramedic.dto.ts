import { IsLatitude, IsLongitude } from 'class-validator';

export class AvailableParamedicDto {
  @IsLongitude()
  gpsLongitude!: number;

  @IsLatitude()
  gpsLatitude!: number;
}

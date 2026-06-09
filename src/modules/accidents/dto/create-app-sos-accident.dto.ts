import { IsLatitude, IsLongitude } from 'class-validator';

export class CreateAppSosAccidentDto {
  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;
}

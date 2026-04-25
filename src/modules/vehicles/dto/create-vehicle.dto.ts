import { Transform } from 'class-transformer';
import { IsInt, IsString, Length, Max, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @Length(1, 100)
  maker!: string;

  @IsString()
  @Length(1, 100)
  model!: string;

  @IsString()
  @Length(1, 30)
  color!: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @IsString()
  @Length(1, 50)
  @Transform(({ value }) => value.toLowerCase().trim())
  licensePlate!: string;
}

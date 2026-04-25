import { Transform } from 'class-transformer';
import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class ClaimObuDto {
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value.toUpperCase().trim())
  instNumber!: string;

  @IsPhoneNumber()
  simCardNumber!: string;
}

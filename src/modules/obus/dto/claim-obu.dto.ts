import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class ClaimObuDto {
  @IsString()
  @Length(1, 100)
  instNumber!: string;

  @IsPhoneNumber()
  simCardNumber!: string;
}

import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class CreateObuDto {
  @IsString()
  @Length(1, 50)
  name!: string;

  @IsString()
  @Length(1, 100)
  instNumber!: string;

  @IsPhoneNumber()
  simCardNumber!: string;

  @IsString()
  @Length(1, 50)
  version!: string;
}

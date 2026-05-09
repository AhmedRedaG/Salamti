import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelAccidentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  cancelReason!: string;
}

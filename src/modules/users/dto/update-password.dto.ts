import { IsNotEmpty, IsStrongPassword, Length } from 'class-validator';

export class UpdatePasswordDto {
  @IsNotEmpty()
  @IsStrongPassword()
  @Length(8, 256)
  oldPassword!: string;

  @IsNotEmpty()
  @IsStrongPassword()
  @Length(8, 256)
  newPassword!: string;
}

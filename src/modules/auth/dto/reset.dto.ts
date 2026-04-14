import { IsJWT, IsStrongPassword, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsJWT()
  resetToken!: string;

  @IsStrongPassword(undefined)
  @Length(8, 256)
  password!: string;
}

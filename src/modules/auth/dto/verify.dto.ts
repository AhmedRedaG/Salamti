import { IsJWT, IsNotEmpty } from 'class-validator';

export class VerifyDto {
  @IsNotEmpty()
  @IsJWT()
  verificationToken!: string;
}

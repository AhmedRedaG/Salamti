import { IsEmail, IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import appConfig from '../../../config/app.config';
import { Transform } from 'class-transformer';

const MIN_OTP_CODE = appConfig().otp.min;
const MAX_OTP_CODE = appConfig().otp.max;

export class SendOtp {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email!: string;
}

export class VerifyOtp {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(MIN_OTP_CODE)
  @Max(MAX_OTP_CODE)
  code!: number;
}

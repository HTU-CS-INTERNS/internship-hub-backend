import { IsEmail, IsString, MinLength } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  otp_code: string;

  @IsString()
  @MinLength(6)
  password: string;
}

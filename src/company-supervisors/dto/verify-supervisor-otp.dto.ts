import { IsEmail, IsString, MinLength } from 'class-validator';

export class VerifySupervisorOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  otp_code: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  job_title?: string;

  @IsString()
  phone_number?: string;
}

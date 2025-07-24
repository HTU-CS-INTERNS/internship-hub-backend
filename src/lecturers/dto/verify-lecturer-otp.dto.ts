import { IsEmail, IsString, MinLength } from 'class-validator';

export class VerifyLecturerOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  otp_code: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  staff_id?: string;

  @IsString()
  phone_number?: string;

  @IsString()
  office_location?: string;
}

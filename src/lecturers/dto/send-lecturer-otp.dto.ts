import { IsEmail } from 'class-validator';

export class SendLecturerOtpDto {
  @IsEmail()
  email: string;
}

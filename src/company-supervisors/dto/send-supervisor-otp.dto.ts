import { IsEmail } from 'class-validator';

export class SendSupervisorOtpDto {
  @IsEmail()
  email: string;
}

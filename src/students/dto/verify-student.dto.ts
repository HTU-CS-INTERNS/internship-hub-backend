import { IsBoolean } from 'class-validator';

export class VerifyStudentDto {
  @IsBoolean()
  is_verified: boolean;
}

import { IsString, IsEmail, IsDateString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class SubmitInternshipDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  company_name: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  company_address: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  supervisor_name: string;

  @IsEmail()
  supervisor_email: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  location: string;

  @IsOptional()
  @IsString()
  rejection_reason?: string;
}

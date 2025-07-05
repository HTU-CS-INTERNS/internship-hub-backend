import { IsString, IsEmail, IsNumber, IsOptional } from 'class-validator';

export class CreatePendingStudentDto {
  @IsString()
  student_id_number: string;

  @IsEmail()
  email: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsNumber()
  faculty_id: number;

  @IsNumber()
  department_id: number;

  @IsOptional()
  @IsString()
  program_of_study?: string;
}

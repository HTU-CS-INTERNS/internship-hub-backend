import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  student_id_number: string;

  @IsInt()
  faculty_id: number;

  @IsInt()
  department_id: number;

  @IsString()
  program_of_study: string;

  @IsOptional()
  @IsBoolean()
  profile_complete?: boolean;
}

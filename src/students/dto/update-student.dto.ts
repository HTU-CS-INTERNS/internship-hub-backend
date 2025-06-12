import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  student_id_number?: string;

  @IsOptional()
  @IsInt()
  faculty_id?: number;

  @IsOptional()
  @IsInt()
  department_id?: number;

  @IsOptional()
  @IsString()
  program_of_study?: string;

  @IsOptional()
  @IsBoolean()
  profile_complete?: boolean;
}

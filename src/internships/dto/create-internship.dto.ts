import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';

export class CreateInternshipDto {
  @IsInt()
  student_id: number;

  @IsInt()
  company_id: number;

  @IsInt()
  company_supervisor_id: number;

  @IsOptional()
  @IsInt()
  lecturer_id?: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsEnum(['active', 'completed', 'cancelled'])
  status?: 'active' | 'completed' | 'cancelled';
}

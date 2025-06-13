// src/lecturers/dto/update-lecturer.dto.ts
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateLecturerDto {
  @IsOptional()
  @IsString()
  staff_id_number?: string;

  @IsInt()
  department_id: number;

  @IsOptional()
  @IsString()
  region?: string;
}

// src/company-supervisors/dto/create-company-supervisor.dto.ts

import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCompanySupervisorDto {
  @IsInt()
  user_id: number;

  @IsInt()
  company_id: number;

  @IsOptional()
  @IsString()
  job_title?: string;
}

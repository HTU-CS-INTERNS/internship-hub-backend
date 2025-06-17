// src/company-supervisors/dto/update-my-profile.dto.ts

import { IsOptional, IsString } from 'class-validator';

export class UpdateMyCompanySupervisorProfileDto {
  @IsOptional()
  @IsString()
  job_title?: string;
}

// src/company-supervisors/dto/update-company-supervisor.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanySupervisorDto } from './create-company-supervisor.dto';

export class UpdateCompanySupervisorDto extends PartialType(
  CreateCompanySupervisorDto,
) {}

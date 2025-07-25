// src/company-supervisors/company-supervisors.module.ts

import { Module } from '@nestjs/common';
import { CompanySupervisorsService } from './company-supervisors.service';
import { CompanySupervisorsController } from './company-supervisors.controller';
import { SupervisorVerificationController } from './supervisor-verification.controller';
import { SupervisorController } from './supervisor.controller';
import { SupervisorService } from './supervisor.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service'; // <--- ADD THIS IMPORT - Adjust path as needed!


@Module({
  controllers: [CompanySupervisorsController, SupervisorVerificationController, SupervisorController],
  providers: [CompanySupervisorsService, SupervisorService, PrismaService, EmailService],
})
export class CompanySupervisorsModule {}

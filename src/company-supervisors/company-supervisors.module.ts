// src/company-supervisors/company-supervisors.module.ts

import { Module } from '@nestjs/common';
import { CompanySupervisorsService } from './company-supervisors.service';
import { CompanySupervisorsController } from './company-supervisors.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [CompanySupervisorsController],
  providers: [CompanySupervisorsService, PrismaService],
})
export class CompanySupervisorsModule {}

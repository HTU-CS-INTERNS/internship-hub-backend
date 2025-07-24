// src/companies/companies.module.ts
import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service'; // <--- ADD THIS IMPORT - Adjust path as needed!


@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, PrismaService, EmailService],
})
export class CompaniesModule {}

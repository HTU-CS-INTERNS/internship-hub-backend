import { Module } from '@nestjs/common';
import { InternshipsService } from './internships.service';
import { InternshipsController } from './internships.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service'; // <--- ADD THIS IMPORT - Adjust path as needed!


@Module({
  controllers: [InternshipsController],
  providers: [InternshipsService, PrismaService, EmailService,],
})
export class InternshipsModule {}

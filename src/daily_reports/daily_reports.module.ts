import { Module } from '@nestjs/common';
import { DailyReportsService } from './daily_reports.service';
import { DailyReportsController } from './daily_reports.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [DailyReportsController],
  providers: [DailyReportsService, PrismaService],
})
export class DailyReportsModule {}

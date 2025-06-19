import { Module } from '@nestjs/common';
import { DailyTasksService } from './daily-tasks.service';
import { DailyTasksController } from './daily-tasks.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  controllers: [DailyTasksController],
  providers: [DailyTasksService, PrismaService, JwtAuthGuard, RolesGuard],
})
export class DailyTasksModule {}

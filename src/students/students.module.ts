import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Module({
  controllers: [StudentsController],
  providers: [
    StudentsService,
    PrismaService,
    RolesGuard,
    JwtAuthGuard, // Optional: if globally applied, remove this
  ],
})
export class StudentsModule {}

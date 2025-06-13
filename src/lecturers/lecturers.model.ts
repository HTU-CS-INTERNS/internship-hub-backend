import { Module } from '@nestjs/common';
import { LecturersService } from './lecturers.service';
import { LecturersController } from './lecturers.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [LecturersController],
  providers: [LecturersService, PrismaService],
})
export class LecturersModule {}

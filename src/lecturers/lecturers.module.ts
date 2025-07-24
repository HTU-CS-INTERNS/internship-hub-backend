import { Module } from '@nestjs/common';
import { LecturersService } from './lecturers.service';
import { LecturersController } from './lecturers.controller';
import { LecturerVerificationController } from './lecturer-verification.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service'; // <--- ADD THIS IMPORT - Adjust path as needed!


@Module({
  imports: [],
  controllers: [LecturersController, LecturerVerificationController],
  providers: [LecturersService, PrismaService, EmailService,],
})
export class LecturersModule {}

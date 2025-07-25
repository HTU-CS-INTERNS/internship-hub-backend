import { Module } from '@nestjs/common';
import { LecturersService } from './lecturers.service';
import { LecturersController } from './lecturers.controller';
import { LecturerVerificationController } from './lecturer-verification.controller';
import { LecturerController } from './lecturer.controller';
import { LecturerService } from './lecturer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service'; // <--- ADD THIS IMPORT - Adjust path as needed!


@Module({
  imports: [],
  controllers: [LecturersController, LecturerVerificationController, LecturerController],
  providers: [LecturersService, LecturerService, PrismaService, EmailService,],
})
export class LecturersModule {}

import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { StudentVerificationController } from './student-verification.controller';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { EmailService } from '../email/email.service'; // <--- ADD THIS IMPORT - Adjust path as needed!


@Module({
  controllers: [StudentsController, StudentVerificationController],
  providers: [
    StudentsService,
    RolesGuard,
    JwtAuthGuard,
    EmailService,
  ],
})
export class StudentsModule {}

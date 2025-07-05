import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('api/student-verification')
export class StudentVerificationController {
  constructor(private readonly studentsService: StudentsService) {}

  // Public endpoint for sending OTP to pending students
  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.studentsService.sendOtp(dto.email);
  }

  // Public endpoint for verifying OTP and creating student account
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.studentsService.verifyOtpAndCreateAccount(dto);
  }
}

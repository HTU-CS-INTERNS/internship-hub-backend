import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { LecturersService } from './lecturers.service';
import { SendLecturerOtpDto } from './dto/send-lecturer-otp.dto';
import { VerifyLecturerOtpDto } from './dto/verify-lecturer-otp.dto';

@Controller('api/lecturer-verification')
export class LecturerVerificationController {
  constructor(private readonly lecturersService: LecturersService) {}

  // Public endpoint for sending OTP to inactive lecturers
  @Post('send-otp')
  sendOtp(@Body() dto: SendLecturerOtpDto) {
    return this.lecturersService.sendLecturerOtp(dto.email);
  }

  // Public endpoint for verifying OTP and activating lecturer account
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyLecturerOtpDto) {
    return this.lecturersService.verifyLecturerOtpAndActivateAccount(dto);
  }
}

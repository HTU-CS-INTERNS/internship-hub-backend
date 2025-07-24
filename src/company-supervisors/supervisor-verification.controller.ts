import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { CompanySupervisorsService } from './company-supervisors.service';
import { SendSupervisorOtpDto } from './dto/send-supervisor-otp.dto';
import { VerifySupervisorOtpDto } from './dto/verify-supervisor-otp.dto';

@Controller('api/supervisor-verification')
export class SupervisorVerificationController {
  constructor(private readonly companySupervisorsService: CompanySupervisorsService) {}

  // Public endpoint for sending OTP to inactive supervisors
  @Post('send-otp')
  sendOtp(@Body() dto: SendSupervisorOtpDto) {
    return this.companySupervisorsService.sendSupervisorOtp(dto.email);
  }

  // Public endpoint for verifying OTP and activating supervisor account
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifySupervisorOtpDto) {
    return this.companySupervisorsService.verifySupervisorOtpAndActivateAccount(dto);
  }
}

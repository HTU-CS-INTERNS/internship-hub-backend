import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard'; // Ensure this path is correct
import { RolesGuard } from '../auth/roles.guard';     // Ensure this path is correct
import { Roles } from '../auth/roles.decorator';       // Ensure this path is correct
import { UpdateStudentDto } from './dto/update-student.dto';
import { VerifyStudentDto } from './dto/verify-student.dto';
import { CreatePendingStudentDto } from './dto/create-pending-student.dto';
 import { SendOtpDto } from './dto/send-otp.dto'; // Not used in controller methods provided
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Request } from 'express'; // Standard Express Request type
import { AuthUser } from '../auth/interfaces/auth-user.interface'; // Your custom AuthUser interface
import { CheckInDto } from './dto/check-in.dto';

@Controller('api/students')
// Apply guards globally to the controller, then override with @Roles as needed
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me/profile')
  @Roles('student')
  getMyProfile(@Req() req: Request & { user: AuthUser }) {
    return this.studentsService.getMyProfile(req.user.id);
  }

  @Put('me/profile')
  @Roles('student')
  updateMyProfile(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.updateMyProfile(req.user.id, dto);
  }

  @Get()
  @Roles('admin', 'hod', 'lecturer') // Add 'hod' role if needed for this route
  getAllStudents(
    @Query()
    query: {
      faculty_id?: string;
      department_id?: string;
      is_verified?: string;
      search?: string;
    },
  ) {
    return this.studentsService.getAllStudents(query);
  }

  @Get(':id/profile')
  @Roles('admin', 'hod', 'lecturer', 'company_supervisor')
  getStudentProfile(@Param('id') id: string) {
    return this.studentsService.getStudentProfile(+id);
  }

  @Put(':id/verify')
  @Roles('admin')
  verifyStudent(@Param('id') id: string, @Body() dto: VerifyStudentDto) {
    return this.studentsService.verifyStudent(+id, dto);
  }

  // Admin endpoints for managing pending students
  @Post('pending')
  @Roles('admin')
  addPendingStudent(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: CreatePendingStudentDto,
  ) {
    return this.studentsService.addPendingStudent(req.user.id, dto);
  }

  @Get('pending')
  @Roles('admin')
  getPendingStudents() {
    return this.studentsService.getPendingStudents();
  }

  /**
   * Endpoint to get the student's primary active internship.
   * This is likely what the dashboard needs (a single object or null).
   */
  @Get('me/active-internship') // New specific endpoint
  @Roles('student')
  getMyActiveInternship(@Req() req: Request & { user: AuthUser }) {
    return this.studentsService.getMyActiveInternship(req.user.id);
  }

  /**
   * Endpoint to get ALL internships associated with a student.
   * This returns an array and might be used for an "Internship History" section.
   * It retains the original name, expecting an array return from the service.
   */
  @Get('me/internship')
  @Roles('student')
  getMyInternships(@Req() req: Request & { user: AuthUser }) {
    // This method in StudentsService returns an array.
    // If you always expect a single internship for /me/internship,
    // you should remove this route and exclusively use 'me/active-internship'.
    // Or, in the service, change getMyInternship to return findFirst().
    return this.studentsService.getMyInternships(req.user.id);
  }

  @Post('me/check-in')
  @Roles('student')
  checkIn(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: CheckInDto,
  ) {
    // Removed defensive typeof check - NestJS dependency injection ensures method existence
    return this.studentsService.checkIn(req.user.id, dto);
  }

  // OTP Verification Endpoints (assuming these are publicly accessible or protected by a specific guard)
  // Typically, send-otp and verify-otp are not protected by JwtAuthGuard as user is not logged in yet.
  // Adjust guards based on your authentication flow.


  @Post('register/send-otp')
  // No @Roles or @UseGuards here if this is for new user registration
  sendOtp(@Body() dto: SendOtpDto) {
    return this.studentsService.sendOtp(dto.email);
  }


  @Post('register/verify-otp')
  // No @Roles or @UseGuards here if this is for new user registration
  verifyOtpAndCreateAccount(@Body() dto: VerifyOtpDto) {
    return this.studentsService.verifyOtpAndCreateAccount(dto);
  }
}
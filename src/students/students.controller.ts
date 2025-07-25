import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { RemindersService } from '../reminders/reminders.service';
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
  constructor(
    private readonly studentsService: StudentsService,
    private readonly remindersService: RemindersService,
  ) {}

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

  /**
   * Get student's activity data for dashboard analytics
   */
  @Get('activity')
  @Roles('student')
  getActivityData(
    @Req() req: Request & { user: AuthUser },
    @Query('period') period?: string,
  ) {
    return this.studentsService.getActivityData(req.user.id, period || 'month');
  }

  /**
   * Get student's dashboard metrics
   */
  @Get('dashboard/metrics')
  @Roles('student')
  getDashboardMetrics(@Req() req: Request & { user: AuthUser }) {
    return this.studentsService.getDashboardMetrics(req.user.id);
  }

  /**
   * Get student's progress data
   */
  @Get('me/progress')
  @Roles('student')
  getProgressData(@Req() req: Request & { user: AuthUser }) {
    return this.studentsService.getProgressData(req.user.id);
  }

  /**
   * Get student's documents
   */
  @Get('me/documents')
  @Roles('student')
  getDocuments(@Req() req: Request & { user: AuthUser }) {
    return this.studentsService.getDocuments(req.user.id);
  }

  /**
   * Upload a document
   */
  @Post('documents/upload')
  @Roles('student')
  uploadDocument(
    @Req() req: Request & { user: AuthUser },
    @Body() uploadData: any,
  ) {
    return this.studentsService.uploadDocument(req.user.id, uploadData);
  }

  /**
   * Delete a document
   */
  @Delete('documents/:id')
  @Roles('student')
  deleteDocument(
    @Req() req: Request & { user: AuthUser },
    @Param('id') documentId: string,
  ) {
    return this.studentsService.deleteDocument(req.user.id, +documentId);
  }

  /**
   * Get student's skills progress
   */
  @Get('me/skills')
  @Roles('student')
  getSkills(@Req() req: Request & { user: AuthUser }) {
    return this.studentsService.getSkills(req.user.id);
  }

  /**
   * Update skill progress
   */
  @Put('skills/:id/progress')
  @Roles('student')
  updateSkillProgress(
    @Req() req: Request & { user: AuthUser },
    @Param('id') skillId: string,
    @Body() progressData: any,
  ) {
    return this.studentsService.updateSkillProgress(req.user.id, +skillId, progressData);
  }

  /**
   * Get student's milestones
   */
  @Get('me/milestones')
  @Roles('student')
  getMilestones(@Req() req: Request & { user: AuthUser }) {
    return this.studentsService.getMilestones(req.user.id);
  }

  /**
   * Update milestone progress
   */
  @Put('milestones/:id/progress')
  @Roles('student')
  updateMilestoneProgress(
    @Req() req: Request & { user: AuthUser },
    @Param('id') milestoneId: string,
    @Body() progressData: any,
  ) {
    return this.studentsService.updateMilestoneProgress(req.user.id, +milestoneId, progressData);
  }

  /**
   * Get attendance records
   */
  @Get('me/attendance')
  @Roles('student')
  getAttendanceRecords(
    @Req() req: Request & { user: AuthUser },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.studentsService.getAttendanceRecords(req.user.id, startDate, endDate);
  }

  /**
   * Submit attendance
   */
  @Post('attendance')
  @Roles('student')
  submitAttendance(
    @Req() req: Request & { user: AuthUser },
    @Body() attendanceData: any,
  ) {
    return this.studentsService.submitAttendance(req.user.id, attendanceData);
  }

  /**
   * Get student's company information from active internship
   */
  @Get('company')
  @Roles('student')
  async getStudentCompany(@Req() req: Request & { user: AuthUser }) {
    const internship = await this.studentsService.getMyActiveInternship(req.user.id);
    
    if (!internship) {
      throw new NotFoundException('No active internship found');
    }

    return {
      company: internship.companies,
      supervisor: internship.company_supervisors,
      internship: {
        id: internship.id,
        start_date: internship.start_date,
        end_date: internship.end_date,
        status: internship.status,
      },
    };
  }

  /**
   * Get student's tasks from active internship
   */
  @Get('tasks')
  @Roles('student')
  getStudentTasks(
    @Req() req: Request & { user: AuthUser },
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.studentsService.getStudentTasks(req.user.id, { status, date });
  }

  /**
   * Create a new task
   */
  @Post('tasks')
  @Roles('student')
  createStudentTask(
    @Req() req: Request & { user: AuthUser },
    @Body() taskData: any,
  ) {
    return this.studentsService.createStudentTask(req.user.id, taskData);
  }

  /**
   * Update a task
   */
  @Put('tasks/:taskId')
  @Roles('student')
  updateStudentTask(
    @Req() req: Request & { user: AuthUser },
    @Param('taskId') taskId: string,
    @Body() taskData: any,
  ) {
    return this.studentsService.updateStudentTask(req.user.id, +taskId, taskData);
  }

  /**
   * Delete a task
   */
  @Delete('tasks/:taskId')
  @Roles('student')
  deleteStudentTask(
    @Req() req: Request & { user: AuthUser },
    @Param('taskId') taskId: string,
  ) {
    return this.studentsService.deleteStudentTask(req.user.id, +taskId);
  }

  /**
   * Get student's reports
   */
  @Get('reports')
  @Roles('student')
  getStudentReports(
    @Req() req: Request & { user: AuthUser },
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.studentsService.getStudentReports(req.user.id, { status, date });
  }

  /**
   * Create a new report
   */
  @Post('reports')
  @Roles('student')
  createStudentReport(
    @Req() req: Request & { user: AuthUser },
    @Body() reportData: any,
  ) {
    return this.studentsService.createStudentReport(req.user.id, reportData);
  }

  /**
   * Update a report
   */
  @Put('reports/:reportId')
  @Roles('student')
  updateStudentReport(
    @Req() req: Request & { user: AuthUser },
    @Param('reportId') reportId: string,
    @Body() reportData: any,
  ) {
    return this.studentsService.updateStudentReport(req.user.id, +reportId, reportData);
  }

  /**
   * Delete a report
   */
  @Delete('reports/:reportId')
  @Roles('student')
  deleteStudentReport(
    @Req() req: Request & { user: AuthUser },
    @Param('reportId') reportId: string,
  ) {
    return this.studentsService.deleteStudentReport(req.user.id, +reportId);
  }

  /**
   * Get student's reminders
   */
  @Get('me/reminders')
  @Roles('student')
  getReminders(@Req() req: Request & { user: AuthUser }) {
    return this.remindersService.getStudentReminders(req.user.id);
  }

  /**
   * Dismiss a reminder
   */
  @Post('reminders/:reminderId/dismiss')
  @Roles('student')
  dismissReminder(
    @Req() req: Request & { user: AuthUser },
    @Param('reminderId') reminderId: string,
  ) {
    return this.remindersService.dismissReminder(req.user.id, reminderId);
  }

  /**
   * Get reminder settings
   */
  @Get('me/reminder-settings')
  @Roles('student')
  getReminderSettings(@Req() req: Request & { user: AuthUser }) {
    return this.remindersService.getReminderSettings(req.user.id);
  }

  /**
   * Update reminder settings
   */
  @Put('me/reminder-settings')
  @Roles('student')
  updateReminderSettings(
    @Req() req: Request & { user: AuthUser },
    @Body() settings: any,
  ) {
    return this.remindersService.updateReminderSettings(req.user.id, settings);
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
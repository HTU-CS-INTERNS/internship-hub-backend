import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LecturerService } from './lecturer.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Request } from 'express';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('lecturer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('lecturer')
export class LecturerController {
  constructor(private readonly lecturerService: LecturerService) {}

  // Dashboard Stats
  @Get('dashboard/stats')
  getDashboardStats(@Req() req: Request & { user: AuthUser }) {
    return this.lecturerService.getDashboardStats(req.user.id);
  }

  // Student Management
  @Get('students')
  getMyStudents(
    @Req() req: Request & { user: AuthUser },
    @Query() filters: any,
  ) {
    return this.lecturerService.getMyStudents(req.user.id, filters);
  }

  @Get('students/:studentId')
  getStudentDetails(
    @Req() req: Request & { user: AuthUser },
    @Param('studentId') studentId: string,
  ) {
    return this.lecturerService.getStudentDetails(req.user.id, +studentId);
  }

  @Put('students/:studentId/status')
  updateStudentStatus(
    @Req() req: Request & { user: AuthUser },
    @Param('studentId') studentId: string,
    @Body() dto: { status: string; notes?: string },
  ) {
    return this.lecturerService.updateStudentStatus(req.user.id, +studentId, dto);
  }

  // Reports Management
  @Get('reports/pending')
  getPendingReports(
    @Req() req: Request & { user: AuthUser },
    @Query() filters: any,
  ) {
    return this.lecturerService.getPendingReports(req.user.id, filters);
  }

  @Get('reports')
  getAllReports(
    @Req() req: Request & { user: AuthUser },
    @Query() filters: any,
  ) {
    return this.lecturerService.getAllReports(req.user.id, filters);
  }

  @Get('reports/:reportId')
  getReportDetails(
    @Req() req: Request & { user: AuthUser },
    @Param('reportId') reportId: string,
  ) {
    return this.lecturerService.getReportDetails(req.user.id, +reportId);
  }

  @Post('reports/:reportId/approve')
  approveReport(
    @Req() req: Request & { user: AuthUser },
    @Param('reportId') reportId: string,
    @Body() dto: { feedback?: string; rating?: number },
  ) {
    return this.lecturerService.approveReport(req.user.id, +reportId, dto);
  }

  @Post('reports/:reportId/reject')
  rejectReport(
    @Req() req: Request & { user: AuthUser },
    @Param('reportId') reportId: string,
    @Body() dto: { reason: string },
  ) {
    return this.lecturerService.rejectReport(req.user.id, +reportId, dto);
  }

  @Post('reports/:reportId/revision')
  requestReportRevision(
    @Req() req: Request & { user: AuthUser },
    @Param('reportId') reportId: string,
    @Body() dto: { feedback: string },
  ) {
    return this.lecturerService.requestReportRevision(req.user.id, +reportId, dto);
  }

  // Student Progress Tracking
  @Get('students/:studentId/progress')
  getStudentProgress(
    @Req() req: Request & { user: AuthUser },
    @Param('studentId') studentId: string,
  ) {
    return this.lecturerService.getStudentProgress(req.user.id, +studentId);
  }

  @Get('students/:studentId/tasks')
  getStudentTasks(
    @Req() req: Request & { user: AuthUser },
    @Param('studentId') studentId: string,
    @Query() filters: any,
  ) {
    return this.lecturerService.getStudentTasks(req.user.id, +studentId, filters);
  }

  @Get('students/:studentId/reports')
  getStudentReports(
    @Req() req: Request & { user: AuthUser },
    @Param('studentId') studentId: string,
    @Query() filters: any,
  ) {
    return this.lecturerService.getStudentReports(req.user.id, +studentId, filters);
  }

  // Analytics & Assessment
  @Get('students/:studentId/analytics')
  getStudentAnalytics(
    @Req() req: Request & { user: AuthUser },
    @Param('studentId') studentId: string,
    @Query('period') period?: string,
  ) {
    return this.lecturerService.getStudentAnalytics(req.user.id, +studentId, period);
  }

  @Get('analytics/department')
  getDepartmentAnalytics(
    @Req() req: Request & { user: AuthUser },
    @Query('period') period?: string,
  ) {
    return this.lecturerService.getDepartmentAnalytics(req.user.id, period);
  }

  // Assessment & Grading
  @Post('students/:studentId/assessment')
  submitAssessment(
    @Req() req: Request & { user: AuthUser },
    @Param('studentId') studentId: string,
    @Body() assessmentData: {
      type: string;
      criteria: Record<string, number>;
      overallGrade: number;
      feedback: string;
      period: string;
    },
  ) {
    return this.lecturerService.submitAssessment(req.user.id, +studentId, assessmentData);
  }

  @Get('assessments')
  getAssessments(
    @Req() req: Request & { user: AuthUser },
    @Query('studentId') studentId?: string,
  ) {
    const studentIdNum = studentId ? +studentId : undefined;
    return this.lecturerService.getAssessments(req.user.id, studentIdNum);
  }

  // Communication
  @Get('notifications')
  getNotifications(
    @Req() req: Request & { user: AuthUser },
    @Query() filters: any,
  ) {
    return this.lecturerService.getNotifications(req.user.id, filters);
  }

  @Put('notifications/:notificationId/read')
  markNotificationAsRead(
    @Req() req: Request & { user: AuthUser },
    @Param('notificationId') notificationId: string,
  ) {
    return this.lecturerService.markNotificationAsRead(req.user.id, +notificationId);
  }

  @Post('students/:studentId/message')
  sendMessageToStudent(
    @Req() req: Request & { user: AuthUser },
    @Param('studentId') studentId: string,
    @Body() dto: { message: string; subject?: string },
  ) {
    return this.lecturerService.sendMessageToStudent(req.user.id, +studentId, dto);
  }

  @Get('messages')
  getMessages(
    @Req() req: Request & { user: AuthUser },
    @Query() filters: any,
  ) {
    return this.lecturerService.getMessages(req.user.id, filters);
  }

  // Internship Management
  @Get('internships')
  getInternships(
    @Req() req: Request & { user: AuthUser },
    @Query() filters: any,
  ) {
    return this.lecturerService.getInternships(req.user.id, filters);
  }

  @Get('internships/:internshipId')
  getInternshipDetails(
    @Req() req: Request & { user: AuthUser },
    @Param('internshipId') internshipId: string,
  ) {
    return this.lecturerService.getInternshipDetails(req.user.id, +internshipId);
  }

  // Profile Management
  @Get('profile')
  getLecturerProfile(@Req() req: Request & { user: AuthUser }) {
    return this.lecturerService.getLecturerProfile(req.user.id);
  }

  @Put('profile')
  updateLecturerProfile(
    @Req() req: Request & { user: AuthUser },
    @Body() profileData: any,
  ) {
    return this.lecturerService.updateLecturerProfile(req.user.id, profileData);
  }
}

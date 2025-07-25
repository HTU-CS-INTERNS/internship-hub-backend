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
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { RemindersService } from '../reminders/reminders.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Request } from 'express';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsPublicController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly remindersService: RemindersService,
  ) {}

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
   * Get student's company information from active internship
   */
  @Get('company')
  @Roles('student')
  async getStudentCompany(@Req() req: Request & { user: AuthUser }) {
    const internship = await this.studentsService.getMyActiveInternship(req.user.id);
    
    if (!internship) {
      throw new Error('No active internship found');
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
   * Submit check-in
   */
  @Post('check-in')
  @Roles('student')
  checkIn(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: { latitude: number; longitude: number },
  ) {
    return this.studentsService.checkIn(req.user.id, dto);
  }

  /**
   * Submit check-out (placeholder - same as check-in for now)
   */
  @Post('check-out')
  @Roles('student')
  checkOut(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: { latitude: number; longitude: number },
  ) {
    // For now, treat as check-in
    return this.studentsService.checkIn(req.user.id, dto);
  }

  /**
   * Get student's tasks
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
   * Get student's documents
   */
  @Get('documents')
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
   * Get student's skills
   */
  @Get('skills')
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
  @Get('milestones')
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
   * Update student profile
   */
  @Put('profile')
  @Roles('student')
  updateProfile(
    @Req() req: Request & { user: AuthUser },
    @Body() profileData: any,
  ) {
    return this.studentsService.updateMyProfile(req.user.id, profileData);
  }
}

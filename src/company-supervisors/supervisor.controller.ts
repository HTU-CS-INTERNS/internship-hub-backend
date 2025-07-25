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
import { SupervisorService } from './supervisor.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Request } from 'express';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('supervisor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('company_supervisor')
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

  // Dashboard Stats
  @Get('dashboard/stats')
  getDashboardStats(@Req() req: Request & { user: AuthUser }) {
    return this.supervisorService.getDashboardStats(req.user.id);
  }

  // Interns Management
  @Get('interns')
  getMyInterns(
    @Req() req: Request & { user: AuthUser },
    @Query() filters: any,
  ) {
    return this.supervisorService.getMyInterns(req.user.id, filters);
  }

  @Get('interns/:internId')
  getInternDetails(
    @Req() req: Request & { user: AuthUser },
    @Param('internId') internId: string,
  ) {
    return this.supervisorService.getInternDetails(req.user.id, +internId);
  }

  @Put('interns/:internId/status')
  updateInternStatus(
    @Req() req: Request & { user: AuthUser },
    @Param('internId') internId: string,
    @Body() dto: { status: string; notes?: string },
  ) {
    return this.supervisorService.updateInternStatus(req.user.id, +internId, dto);
  }

  // Task Management
  @Get('tasks/pending')
  getPendingTasks(
    @Req() req: Request & { user: AuthUser },
    @Query() filters: any,
  ) {
    return this.supervisorService.getPendingTasks(req.user.id, filters);
  }

  @Post('tasks/:taskId/approve')
  approveTask(
    @Req() req: Request & { user: AuthUser },
    @Param('taskId') taskId: string,
    @Body() dto: { feedback?: string; rating?: number },
  ) {
    return this.supervisorService.approveTask(req.user.id, +taskId, dto);
  }

  @Post('tasks/:taskId/reject')
  rejectTask(
    @Req() req: Request & { user: AuthUser },
    @Param('taskId') taskId: string,
    @Body() dto: { reason: string },
  ) {
    return this.supervisorService.rejectTask(req.user.id, +taskId, dto);
  }

  @Post('interns/:internId/tasks')
  assignTask(
    @Req() req: Request & { user: AuthUser },
    @Param('internId') internId: string,
    @Body() taskData: {
      title: string;
      description: string;
      dueDate: string;
      priority: 'low' | 'medium' | 'high';
    },
  ) {
    return this.supervisorService.assignTask(req.user.id, +internId, taskData);
  }

  // Task Analytics & Performance - Supervisors focus on tasks only
  @Get('tasks/stats')
  getTaskStats(
    @Req() req: Request & { user: AuthUser },
    @Query() filters: any,
  ) {
    return this.supervisorService.getTaskStats(req.user.id, filters);
  }

  @Get('interns/:internId/task-analytics')
  getInternTaskAnalytics(
    @Req() req: Request & { user: AuthUser },
    @Param('internId') internId: string,
  ) {
    return this.supervisorService.getInternTaskAnalytics(req.user.id, +internId);
  }

  @Get('interns/:internId/activity')
  getInternActivityLog(
    @Req() req: Request & { user: AuthUser },
    @Param('internId') internId: string,
    @Query() filters: any,
  ) {
    return this.supervisorService.getInternActivityLog(req.user.id, +internId, filters);
  }

  @Post('tasks/:taskId/evaluate')
  evaluateTask(
    @Req() req: Request & { user: AuthUser },
    @Param('taskId') taskId: string,
    @Body() evaluationData: {
      rating: number;
      feedback: string;
      skillsAssessment?: {
        technical: number;
        communication: number;
        initiative: number;
      };
    },
  ) {
    return this.supervisorService.evaluateTask(req.user.id, +taskId, evaluationData);
  }

  // Company Profile & Settings
  @Get('company/profile')
  getCompanyProfile(@Req() req: Request & { user: AuthUser }) {
    return this.supervisorService.getCompanyProfile(req.user.id);
  }

  @Put('company/profile')
  updateCompanyProfile(
    @Req() req: Request & { user: AuthUser },
    @Body() profileData: any,
  ) {
    return this.supervisorService.updateCompanyProfile(req.user.id, profileData);
  }

  @Get('profile')
  getSupervisorProfile(@Req() req: Request & { user: AuthUser }) {
    return this.supervisorService.getSupervisorProfile(req.user.id);
  }

  @Put('profile')
  updateSupervisorProfile(
    @Req() req: Request & { user: AuthUser },
    @Body() profileData: any,
  ) {
    return this.supervisorService.updateSupervisorProfile(req.user.id, profileData);
  }
}

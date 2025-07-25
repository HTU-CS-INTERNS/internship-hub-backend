import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DailyReportsService } from './daily_reports.service';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CreateDailyReportDto } from './dto/create-daily_report.dto';
import { UpdateDailyReportDto } from './dto/update-daily_report.dto';
import { FeedbackDto } from './dto/feedback.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Request } from 'express';

@Controller('internships/:internshipId/daily-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyReportsController {
  constructor(private readonly service: DailyReportsService) {}

  @Post()
  @Roles('student')
  create(
    @Param('internshipId') internshipId: string,
    @Body() dto: CreateDailyReportDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.service.createDailyReport(+internshipId, +req.user.id, dto);
  }

  @Get()
  @Roles('student', 'lecturer', 'company_supervisor', 'admin', 'hod')
  findAll(
    @Param('internshipId') internshipId: string,
    @Query() query: { report_date?: string; status?: string },
  ) {
    return this.service.getAllReports(+internshipId, query);
  }

  @Get(':reportId')
  @Roles('student', 'lecturer', 'company_supervisor', 'admin', 'hod')
  findOne(
    @Param('internshipId') internshipId: string,
    @Param('reportId') reportId: string,
  ) {
    return this.service.getReportById(+internshipId, +reportId);
  }

  @Put(':reportId')
  @Roles('student')
  update(
    @Param('internshipId') internshipId: string,
    @Param('reportId') reportId: string,
    @Body() dto: UpdateDailyReportDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.service.updateReport(
      +internshipId,
      +reportId,
      +req.user.id,
      dto,
    );
  }

  @Put(':reportId/feedback/company-supervisor')
  @Roles('company_supervisor')
  supervisorFeedback(
    @Param('reportId') reportId: string,
    @Body() dto: FeedbackDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.service.supervisorFeedback(+reportId, +req.user.id, dto);
  }

  @Put(':reportId/feedback/lecturer')
  @Roles('lecturer')
  lecturerFeedback(
    @Param('reportId') reportId: string,
    @Body() dto: FeedbackDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.service.lecturerFeedback(+reportId, +req.user.id, dto);
  }

  @Put(':reportId/status/approve')
  @Roles('company_supervisor')
  approve(
    @Param('reportId') reportId: string,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.service.approveReport(+reportId, +req.user.id);
  }

  @Put(':reportId/status/reject')
  @Roles('company_supervisor')
  reject(
    @Param('reportId') reportId: string,
    @Body() dto: RejectReportDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.service.rejectReport(+reportId, dto, +req.user.id);
  }

  @Put(':reportId/draft')
  @Roles('student')
  saveDraft(
    @Param('reportId') reportId: string,
    @Body() dto: UpdateDailyReportDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.service.saveDraft(+reportId, +req.user.id, dto);
  }
}

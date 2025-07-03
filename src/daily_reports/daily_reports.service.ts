import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDailyReportDto } from './dto/create-daily_report.dto';
import { UpdateDailyReportDto } from './dto/update-daily_report.dto';
import { FeedbackDto } from './dto/feedback.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { Prisma } from '@prisma/client';

interface ReportQuery {
  report_date?: string;
  status?: string;
}

@Injectable()
export class DailyReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDailyReport(
    internshipId: number,
    userId: number,
    dto: CreateDailyReportDto,
  ) {
    const internship = await this.prisma.internships.findUnique({
      where: { id: internshipId },
    });

    if (!internship || internship.student_id !== userId) {
      throw new ForbiddenException(
        'Not authorized to submit report for this internship',
      );
    }

    return this.prisma.daily_reports.create({
      data: {
        internship_id: internshipId,
        report_date: new Date(dto.report_date),
        summary_of_work: dto.summary_of_work,
        related_task_ids: dto.related_task_ids ?? null,
      },
    });
  }

  async getAllReports(internshipId: number, query: ReportQuery) {
    const where: Prisma.daily_reportsWhereInput = {
      internship_id: internshipId,
      report_date: query.report_date ? new Date(query.report_date) : undefined,
      status: query.status ?? undefined,
    };

    return this.prisma.daily_reports.findMany({
      where,
      orderBy: { report_date: 'desc' },
    });
  }

  async getReportById(internshipId: number, reportId: number) {
    const report = await this.prisma.daily_reports.findFirst({
      where: {
        id: reportId,
        internship_id: internshipId,
      },
    });

    if (!report) throw new NotFoundException('Daily report not found');
    return report;
  }

  async updateReport(
    internshipId: number,
    reportId: number,
    userId: number,
    dto: UpdateDailyReportDto,
  ) {
    const report = await this.prisma.daily_reports.findUnique({
      where: { id: reportId },
    });

    if (!report || report.internship_id !== internshipId) {
      throw new NotFoundException('Report not found for internship');
    }

    const internship = await this.prisma.internships.findUnique({
      where: { id: internshipId },
    });

    if (!internship || internship.student_id !== userId) {
      throw new ForbiddenException('You are not allowed to update this report');
    }

    return this.prisma.daily_reports.update({
      where: { id: reportId },
      data: {
        ...dto,
        last_update_at: new Date(),
      },
    });
  }

  async supervisorFeedback(reportId: number, userId: number, dto: FeedbackDto) {
    return this.prisma.daily_reports.update({
      where: { id: reportId },
      data: {
        company_supervisor_feedback: dto.feedback,
      },
    });
  }

  async lecturerFeedback(reportId: number, userId: number, dto: FeedbackDto) {
    return this.prisma.daily_reports.update({
      where: { id: reportId },
      data: {
        lecturer_feedback: dto.feedback,
      },
    });
  }

  async approveReport(reportId: number, supervisorId: number) {
    return this.prisma.daily_reports.update({
      where: { id: reportId },
      data: {
        status: 'approved',
        approved_by_supervisor_id: supervisorId,
        approved_timestamp: new Date(),
      },
    });
  }

  async rejectReport(
    reportId: number,
    dto: RejectReportDto,
    supervisorId: number,
  ) {
    return this.prisma.daily_reports.update({
      where: { id: reportId },
      data: {
        status: 'rejected',
        approved_by_supervisor_id: supervisorId,
        approved_timestamp: new Date(),
        company_supervisor_feedback: dto.reason ?? 'No reason provided',
      },
    });
  }

  async saveDraft(reportId: number, userId: number, dto: UpdateDailyReportDto) {
    return this.prisma.daily_reports.update({
      where: { id: reportId },
      data: {
        ...dto,
        status: 'draft',
        last_update_at: new Date(),
      },
    });
  }
}

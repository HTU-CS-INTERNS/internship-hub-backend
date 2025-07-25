import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException, // <-- Import BadRequestException
} from '@nestjs/common';
import { InternshipsService } from './internships.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignLecturerDto } from './dto/assign-lecturer.dto';
import { SubmitInternshipDto } from './dto/submit-internship.dto';
import { ApproveRejectInternshipDto } from './dto/approve-reject-internship.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Request } from 'express'; // Ensure Request is imported for @Req() type hinting

@Controller('internships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternshipsController {
  constructor(private readonly internshipService: InternshipsService) {}

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateInternshipDto) {
    return this.internshipService.createInternship(dto);
  }

  @Get('me')
  @Roles('student', 'lecturer', 'company_supervisor')
  getMine(@Req() req: Request & { user: AuthUser }) {
    return this.internshipService.getMyInternships(req.user.id, req.user.role);
  }

  @Get(':id')
  @Roles('admin', 'student', 'lecturer', 'company_supervisor')
  getById(@Param('id') id: string) {
    // FIX: Validate the ID parameter before passing it to the service
    const internshipId = parseInt(id, 10); // Convert string to number

    // If the conversion results in NaN (Not a Number), it means the ID was invalid
    if (isNaN(internshipId)) {
      throw new BadRequestException('Invalid internship ID provided. ID must be a number.');
    }

    return this.internshipService.getInternshipById(internshipId);
  }

  @Put(':id/assign-lecturer')
  @Roles('admin')
  assignLecturer(@Param('id') id: string, @Body() dto: AssignLecturerDto) {
    const internshipId = parseInt(id, 10);
    if (isNaN(internshipId)) {
      throw new BadRequestException('Invalid internship ID provided.');
    }
    return this.internshipService.assignLecturer(internshipId, dto);
  }

  @Put(':id/status')
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    const internshipId = parseInt(id, 10);
    if (isNaN(internshipId)) {
      throw new BadRequestException('Invalid internship ID provided.');
    }
    return this.internshipService.updateStatus(internshipId, dto);
  }

  // Student submits internship for approval
  @Post('submit')
  @Roles('student')
  async submitInternship(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: SubmitInternshipDto
  ) {
    const student = await this.internshipService.getStudentByUserId(req.user.id);
    console.log('Controller received:', { studentId: student.id, dto });
    return this.internshipService.submitInternshipForApproval(student.id, dto);
  }

  // Student gets their pending internship
  @Get('my-submission')
  @Roles('student')
  async getMySubmission(@Req() req: Request & { user: AuthUser }) {
    const student = await this.internshipService.getStudentByUserId(req.user.id);
    return this.internshipService.getStudentPendingInternship(student.id);
  }

  // Admin gets all pending submissions
  @Get('pending')
  @Roles('admin')
  async getPendingSubmissions() {
    return this.internshipService.getPendingInternships();
  }

  // Admin approves or rejects a submission
  @Put('pending/:id/review')
  @Roles('admin')
  async reviewSubmission(
    @Param('id') id: string,
    @Req() req: Request & { user: AuthUser },
    @Body() dto: ApproveRejectInternshipDto
  ) {
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      throw new BadRequestException('Invalid submission ID provided.');
    }
    return this.internshipService.approveRejectInternship(submissionId, req.user.id, dto);
  }
}
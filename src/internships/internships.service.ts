import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignLecturerDto } from './dto/assign-lecturer.dto';
import { SubmitInternshipDto } from './dto/submit-internship.dto';
import { ApproveRejectInternshipDto } from './dto/approve-reject-internship.dto';

@Injectable()
export class InternshipsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper method to get student by user ID
  async getStudentByUserId(userId: number) {
    const student = await this.prisma.students.findUnique({
      where: { user_id: userId },
    });
    
    if (!student) {
      throw new NotFoundException('Student record not found');
    }
    
    return student;
  }

  async createInternship(dto: CreateInternshipDto) {
    return this.prisma.internships.create({
      data: {
        ...dto,
        status: dto.status || 'active',
      },
    });
  }

  async getInternshipById(id: number) {
    const internship = await this.prisma.internships.findUnique({
      where: { id },
      include: {
        students: { include: { users: true } },
        companies: true,
        company_supervisors: { include: { users: true } },
        lecturers: { include: { users: true } },
      },
    });

    if (!internship) throw new NotFoundException('Internship not found');
    return internship;
  }

  async getMyInternships(userId: number, role: string) {
    // Normalize role to handle both frontend (uppercase) and backend (lowercase) role formats
    const normalizedRole = role.toLowerCase();
    
    switch (normalizedRole) {
      case 'student':
        // First get the student record for this user
        const student = await this.getStudentByUserId(userId);
        return this.prisma.internships.findMany({
          where: { student_id: student.id },
          include: { companies: true, company_supervisors: { include: { users: true } } },
        });
      case 'lecturer':
        // First get the lecturer record for this user
        const lecturer = await this.prisma.lecturers.findFirst({
          where: { user_id: userId },
        });
        if (!lecturer) return [];
        return this.prisma.internships.findMany({
          where: { lecturer_id: lecturer.id },
          include: { students: { include: { users: true } }, companies: true },
        });
      case 'company_supervisor':
      case 'supervisor':
        // First get the company supervisor record for this user
        const supervisor = await this.prisma.company_supervisors.findFirst({
          where: { user_id: userId },
        });
        if (!supervisor) return [];
        return this.prisma.internships.findMany({
          where: { company_supervisor_id: supervisor.id },
          include: { students: { include: { users: true } }, companies: true },
        });
      default:
        return [];
    }
  }

  async assignLecturer(id: number, dto: AssignLecturerDto) {
    return this.prisma.internships.update({
      where: { id },
      data: { lecturer_id: dto.lecturer_id },
    });
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    return this.prisma.internships.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // Student submits internship for approval
  async submitInternshipForApproval(studentId: number, dto: SubmitInternshipDto) {
    // Check if student already has a pending or approved internship
    const existingSubmission = await this.prisma.pending_internships.findUnique({
      where: { student_id: studentId },
    });

    if (existingSubmission) {
      // Update existing submission
      return this.prisma.pending_internships.update({
        where: { student_id: studentId },
        data: {
          company_name: dto.company_name,
          company_address: dto.company_address,
          supervisor_name: dto.supervisor_name,
          supervisor_email: dto.supervisor_email,
          start_date: new Date(dto.start_date),
          end_date: new Date(dto.end_date),
          location: dto.location,
          status: 'PENDING_APPROVAL',
          rejection_reason: null,
          submitted_at: new Date(),
          reviewed_at: null,
          reviewed_by: null,
        },
      });
    } else {
      // Create new submission
      return this.prisma.pending_internships.create({
        data: {
          student_id: studentId,
          company_name: dto.company_name,
          company_address: dto.company_address,
          supervisor_name: dto.supervisor_name,
          supervisor_email: dto.supervisor_email,
          start_date: new Date(dto.start_date),
          end_date: new Date(dto.end_date),
          location: dto.location,
          status: 'PENDING_APPROVAL',
        },
      });
    }
  }

  // Get student's pending internship submission
  async getStudentPendingInternship(studentId: number) {
    return this.prisma.pending_internships.findUnique({
      where: { student_id: studentId },
      include: {
        students: {
          include: { users: true },
        },
      },
    });
  }

  // Admin gets all pending internship submissions
  async getPendingInternships() {
    return this.prisma.pending_internships.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        students: {
          include: { users: true },
        },
      },
      orderBy: { submitted_at: 'desc' },
    });
  }

  // Admin approves or rejects internship submission
  async approveRejectInternship(submissionId: number, reviewerId: number, dto: ApproveRejectInternshipDto) {
    const submission = await this.prisma.pending_internships.findUnique({
      where: { id: submissionId },
      include: { students: true },
    });

    if (!submission) {
      throw new NotFoundException('Internship submission not found');
    }

    // Update the pending internship status
    const updatedSubmission = await this.prisma.pending_internships.update({
      where: { id: submissionId },
      data: {
        status: dto.status,
        rejection_reason: dto.rejection_reason || null,
        reviewed_at: new Date(),
        reviewed_by: reviewerId,
      },
    });

    // If approved, create company, supervisor, and actual internship
    if (dto.status === 'APPROVED') {
      await this.createApprovedInternship(submission);
    }

    return updatedSubmission;
  }

  private async createApprovedInternship(submission: any) {
    // Create or find company
    let company = await this.prisma.companies.findFirst({
      where: { name: submission.company_name },
    });

    if (!company) {
      company = await this.prisma.companies.create({
        data: {
          name: submission.company_name,
          address: submission.company_address,
          city: 'Unknown', // Could be extracted from address
          region: 'Unknown', // Could be extracted from address
        },
      });
    }

    // Create supervisor user account
    let supervisorUser = await this.prisma.users.findUnique({
      where: { email: submission.supervisor_email },
    });

    if (!supervisorUser) {
      supervisorUser = await this.prisma.users.create({
        data: {
          email: submission.supervisor_email,
          password: 'temporary_password', // Should generate a secure temporary password
          role: 'supervisor',
          first_name: submission.supervisor_name.split(' ')[0] || submission.supervisor_name,
          last_name: submission.supervisor_name.split(' ').slice(1).join(' ') || '',
        },
      });
    }

    // Create company supervisor record
    let companySupervisor = await this.prisma.company_supervisors.findFirst({
      where: { 
        user_id: supervisorUser.id,
        company_id: company.id,
      },
    });

    if (!companySupervisor) {
      companySupervisor = await this.prisma.company_supervisors.create({
        data: {
          user_id: supervisorUser.id,
          company_id: company.id,
          job_title: 'Supervisor',
        },
      });
    }

    // Create the actual internship
    return this.prisma.internships.create({
      data: {
        student_id: submission.student_id,
        company_id: company.id,
        company_supervisor_id: companySupervisor.id,
        start_date: submission.start_date,
        end_date: submission.end_date,
        status: 'active',
      },
    });
  }
}

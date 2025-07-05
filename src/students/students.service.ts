import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateStudentDto } from './dto/update-student.dto';
import { VerifyStudentDto } from './dto/verify-student.dto';
import { CreatePendingStudentDto } from './dto/create-pending-student.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: number) {
    const student = await this.prisma.students.findFirst({
      where: { user_id: userId },
      include: { faculties: true, departments: true },
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async updateMyProfile(userId: number, dto: UpdateStudentDto) {
    const student = await this.prisma.students.findFirst({
      where: { user_id: userId },
    });

    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.students.update({
      where: { id: student.id },
      data: { ...dto },
    });
  }

  async getAllStudents(query: {
    faculty_id?: string;
    department_id?: string;
    is_verified?: string;
    search?: string;
  }) {
    const where: Prisma.studentsWhereInput = {
      faculty_id: query.faculty_id ? Number(query.faculty_id) : undefined,
      department_id: query.department_id
        ? Number(query.department_id)
        : undefined,
      is_verified:
        query.is_verified !== undefined
          ? query.is_verified === 'true'
          : undefined,
    };

    if (query.search) {
      where.OR = [
        {
          student_id_number: {
            contains: query.search,
          },
        },
        {
          users: {
            first_name: {
              contains: query.search,
              // omit 'mode' if not supported on relational fields
            },
          },
        },
        {
          users: {
            last_name: {
              contains: query.search,
            },
          },
        },
      ];
    }

    return this.prisma.students.findMany({
      where,
      include: { users: true, faculties: true, departments: true },
    });
  }

  async getStudentProfile(id: number) {
    const student = await this.prisma.students.findUnique({
      where: { id },
      include: { users: true, faculties: true, departments: true },
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async verifyStudent(id: number, dto: VerifyStudentDto) {
    return this.prisma.students.update({
      where: { id },
      data: { is_verified: dto.is_verified },
    });
  }

  // Admin methods for managing pending students
  async addPendingStudent(adminId: number, dto: CreatePendingStudentDto) {
    // Check if student already exists
    const existingPending = await this.prisma.pending_students.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { student_id_number: dto.student_id_number },
        ],
      },
    });

    if (existingPending) {
      throw new ConflictException('Student with this email or ID already exists in pending list');
    }

    // Check if user already exists
    const existingUser = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    return this.prisma.pending_students.create({
      data: {
        ...dto,
        added_by_admin_id: adminId,
      },
      include: {
        faculties: true,
        departments: true,
      },
    });
  }

  async getPendingStudents() {
    return this.prisma.pending_students.findMany({
      include: {
        faculties: true,
        departments: true,
        admin: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // OTP verification methods
  async sendOtp(email: string) {
    // Check if this email is in pending students
    const pendingStudent = await this.prisma.pending_students.findUnique({
      where: { email },
    });

    if (!pendingStudent) {
      throw new NotFoundException('Email not found in pending students list. Please contact admin.');
    }

    if (pendingStudent.is_verified) {
      throw new BadRequestException('Student already verified');
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    await this.prisma.otp_verifications.create({
      data: {
        email,
        otp_code: otpCode,
        purpose: 'student_registration',
        expires_at: expiresAt,
      },
    });

    // TODO: Send email with OTP
    // For now, we'll just log it (in production, integrate with email service)
    console.log(`OTP for ${email}: ${otpCode}`);

    return {
      message: 'OTP sent successfully to your email',
      email,
      // TODO: Remove this in production
      otp: otpCode, // For testing purposes only
    };
  }

  async verifyOtpAndCreateAccount(dto: VerifyOtpDto) {
    // Find valid OTP
    const otpRecord = await this.prisma.otp_verifications.findFirst({
      where: {
        email: dto.email,
        otp_code: dto.otp_code,
        purpose: 'student_registration',
        is_used: false,
        expires_at: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Get pending student data
    const pendingStudent = await this.prisma.pending_students.findUnique({
      where: { email: dto.email },
    });

    if (!pendingStudent) {
      throw new NotFoundException('Pending student record not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      // Create user and student in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.users.create({
          data: {
            email: dto.email,
            password: hashedPassword,
            role: 'student',
            first_name: pendingStudent.first_name,
            last_name: pendingStudent.last_name,
          },
        });

        // Create student
        const student = await tx.students.create({
          data: {
            user_id: user.id,
            student_id_number: pendingStudent.student_id_number,
            faculty_id: pendingStudent.faculty_id,
            department_id: pendingStudent.department_id,
            program_of_study: pendingStudent.program_of_study,
            is_verified: true,
            profile_complete: false,
          },
        });

        // Mark OTP as used
        await tx.otp_verifications.update({
          where: { id: otpRecord.id },
          data: { is_used: true },
        });

        // Mark pending student as verified
        await tx.pending_students.update({
          where: { id: pendingStudent.id },
          data: { is_verified: true },
        });

        return { user, student };
      });

      return {
        message: 'Account created successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          first_name: result.user.first_name,
          last_name: result.user.last_name,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to create account');
    }
  }
}

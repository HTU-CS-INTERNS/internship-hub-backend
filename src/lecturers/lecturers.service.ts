import { EmailService } from '../email/email.service';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { VerifyLecturerOtpDto } from './dto/verify-lecturer-otp.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LecturersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // Get the authenticated lecturer's profile
  async getMyProfile(userId: number) {
    const lecturer = await this.prisma.lecturers.findFirst({
      where: { user_id: userId },
      include: { faculties: true, departments: true },
    });

    if (!lecturer) throw new NotFoundException('Lecturer not found');
    return lecturer;
  }

  // Update authenticated lecturer's profile
  async updateMyProfile(userId: number, dto: UpdateLecturerDto) {
    const lecturer = await this.prisma.lecturers.findFirst({
      where: { user_id: userId },
    });

    if (!lecturer) throw new NotFoundException('Lecturer not found');

    return this.prisma.lecturers.update({
      where: { id: lecturer.id },
      data: { ...dto },
    });
  }

  // Get all lecturers (with optional filters)
  async getAllLecturers(query: {
    faculty_id?: string;
    department_id?: string;
    search?: string;
  }) {
    const where: Prisma.lecturersWhereInput = {
      faculty_id: query.faculty_id ? Number(query.faculty_id) : undefined,
      department_id: query.department_id
        ? Number(query.department_id)
        : undefined,
      OR: query.search
        ? [
            {
              staff_id_number: {
                contains: query.search,
              },
            },
            {
              users: {
                first_name: {
                  contains: query.search,
                  // 'mode' removed to match expected Prisma input type
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
          ]
        : undefined,
    };

    return this.prisma.lecturers.findMany({
      where,
      include: { users: true, faculties: true, departments: true },
    });
  }

  // Get a specific lecturer by ID
  async getLecturerProfile(id: number) {
    const lecturer = await this.prisma.lecturers.findUnique({
      where: { id },
      include: { users: true, faculties: true, departments: true },
    });

    if (!lecturer) throw new NotFoundException('Lecturer not found');
    return lecturer;
  }

  // Assign student to lecturer (requires all required fields from internships model)
  async assignStudent(lecturerId: number, studentId: number) {
    // NOTE: You must supply required fields like company_id, supervisor_id, etc., if present in the schema.
    return this.prisma.internships.create({
      data: {
        lecturer_id: lecturerId,
        student_id: studentId,
        // You MUST add defaults or actual values for required fields like:
        company_id: 1, // placeholder
        company_supervisor_id: 1, // placeholder
        start_date: new Date(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      },
    });
  }

  // Get students assigned to a lecturer
  async getAssignedStudents(userId: number) {
    const lecturer = await this.prisma.lecturers.findFirst({
      where: { user_id: userId },
    });

    if (!lecturer) throw new NotFoundException('Lecturer not found');

    return this.prisma.internships.findMany({
      where: { lecturer_id: lecturer.id },
      include: {
        students: {
          include: { users: true },
        },
      },
    });
  }

  // OTP verification methods for lecturer onboarding
  async sendLecturerOtp(email: string) {
    // Check if this email is an inactive lecturer
    const lecturerUser = await this.prisma.users.findUnique({
      where: { 
        email,
        role: 'lecturer',
        is_active: false,
      },
    });

    if (!lecturerUser) {
      throw new NotFoundException('Lecturer account not found or already activated. Please contact your administrator.');
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    await this.prisma.otp_verifications.create({
      data: {
        email,
        otp_code: otpCode,
        purpose: 'lecturer_activation',
        expires_at: expiresAt,
      },
    });

    // TODO: Send email with OTP
    // For now, we'll just log it (in production, integrate with email service)
    console.log(`OTP for lecturer ${email}: ${otpCode}`);

    return {
      message: 'OTP sent successfully to your email',
      email,
      // TODO: Remove this in production
      otp: otpCode, // For testing purposes only
    };
  }

  async verifyLecturerOtpAndActivateAccount(dto: VerifyLecturerOtpDto) {
    // Find valid OTP
    const otpRecord = await this.prisma.otp_verifications.findFirst({
      where: {
        email: dto.email,
        otp_code: dto.otp_code,
        purpose: 'lecturer_activation',
        is_used: false,
        expires_at: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Get lecturer user
    const lecturerUser = await this.prisma.users.findUnique({
      where: { 
        email: dto.email,
        role: 'lecturer',
      },
    });

    if (!lecturerUser) {
      throw new NotFoundException('Lecturer account not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      // Update user and lecturer in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Update user with password and activate account
        const updatedUser = await tx.users.update({
          where: { id: lecturerUser.id },
          data: {
            password: hashedPassword,
            phone_number: dto.phone_number || lecturerUser.phone_number,
            is_active: true,
          },
        });

        // Update lecturer profile if provided
        const lecturerProfile = await tx.lecturers.findFirst({
          where: { user_id: lecturerUser.id },
        });

        if (lecturerProfile && dto.staff_id) {
          await tx.lecturers.update({
            where: { id: lecturerProfile.id },
            data: {
              staff_id_number: dto.staff_id || lecturerProfile.staff_id_number,
            },
          });
        }

        // Mark OTP as used
        await tx.otp_verifications.update({
          where: { id: otpRecord.id },
          data: { is_used: true },
        });

        return updatedUser;
      });

      return {
        message: 'Account activated successfully',
        user: {
          id: result.id,
          email: result.email,
          role: result.role,
          first_name: result.first_name,
          last_name: result.last_name,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to activate account');
    }
  }
  }

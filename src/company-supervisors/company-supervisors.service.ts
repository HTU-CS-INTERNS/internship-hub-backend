import { EmailService } from '../email/email.service';
// src/company-supervisors/company-supervisors.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanySupervisorDto } from './dto/create-company-supervisor.dto';
// import { UpdateCompanySupervisorDto } from './dto/update-company-supervisor.dto';
import { UpdateMyCompanySupervisorProfileDto } from './dto/update-my-profile.dto';
import { VerifySupervisorOtpDto } from './dto/verify-supervisor-otp.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanySupervisorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateCompanySupervisorDto) {
    return this.prisma.company_supervisors.create({
      data: dto,
    });
  }

  async getMyProfile(userId: number) {
    const supervisor = await this.prisma.company_supervisors.findFirst({
      where: { user_id: userId },
      include: { users: true, companies: true },
    });

    if (!supervisor) throw new NotFoundException('Supervisor not found');
    return supervisor;
  }

  async updateMyProfile(
    userId: number,
    dto: UpdateMyCompanySupervisorProfileDto,
  ) {
    const supervisor = await this.prisma.company_supervisors.findFirst({
      where: { user_id: userId },
    });

    if (!supervisor) throw new NotFoundException('Supervisor not found');

    return this.prisma.company_supervisors.update({
      where: { id: supervisor.id },
      data: dto,
    });
  }

  async getSupervisorProfile(id: number) {
    const supervisor = await this.prisma.company_supervisors.findUnique({
      where: { id },
      include: { users: true, companies: true },
    });

    if (!supervisor) throw new NotFoundException('Supervisor not found');
    return supervisor;
  }

  async getMyInterns(userId: number) {
    const supervisor = await this.prisma.company_supervisors.findFirst({
      where: { user_id: userId },
    });

    if (!supervisor) throw new NotFoundException('Supervisor not found');

    return this.prisma.internships.findMany({
      where: { company_supervisor_id: supervisor.id },
      include: {
        students: {
          include: { users: true, faculties: true, departments: true },
        },
      },
    });
  }

  // OTP verification methods for supervisor onboarding
  async sendSupervisorOtp(email: string) {
    // Check if this email is an inactive supervisor
    const supervisorUser = await this.prisma.users.findUnique({
      where: { 
        email,
        role: 'supervisor',
        is_active: false,
      },
    });

    if (!supervisorUser) {
      throw new NotFoundException('Supervisor account not found or already activated. Please contact your administrator.');
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    await this.prisma.otp_verifications.create({
      data: {
        email,
        otp_code: otpCode,
        purpose: 'supervisor_activation',
        expires_at: expiresAt,
      },
    });

    // Send email with OTP
    const subject = 'Your Internship Hub Supervisor Account Verification Code';
    const text = `Your OTP for supervisor account activation is: ${otpCode}. It will expire in 10 minutes.`;
    const html = `<p>Your OTP for supervisor account activation is: <strong>${otpCode}</strong></p><p>It will expire in 10 minutes.</p>`;
    await this.emailService.sendMail(email, subject, text, html);

    return {
      message: 'OTP sent successfully to your email',
      email,
    };
  }

  async verifySupervisorOtpAndActivateAccount(dto: VerifySupervisorOtpDto) {
    // Find valid OTP
    const otpRecord = await this.prisma.otp_verifications.findFirst({
      where: {
        email: dto.email,
        otp_code: dto.otp_code,
        purpose: 'supervisor_activation',
        is_used: false,
        expires_at: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Get supervisor user
    const supervisorUser = await this.prisma.users.findUnique({
      where: { 
        email: dto.email,
        role: 'supervisor',
      },
    });

    if (!supervisorUser) {
      throw new NotFoundException('Supervisor account not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      // Update user and supervisor in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Update user with password and activate account
        const updatedUser = await tx.users.update({
          where: { id: supervisorUser.id },
          data: {
            password: hashedPassword,
            is_active: true,
          },
        });

        // Update supervisor profile if provided
        const supervisorProfile = await tx.company_supervisors.findFirst({
          where: { user_id: supervisorUser.id },
        });

        if (supervisorProfile && (dto.job_title || dto.phone_number)) {
          await tx.company_supervisors.update({
            where: { id: supervisorProfile.id },
            data: {
              job_title: dto.job_title || supervisorProfile.job_title,
            },
          });
        }

        // Update user phone number if provided
        if (dto.phone_number) {
          await tx.users.update({
            where: { id: supervisorUser.id },
            data: {
              phone_number: dto.phone_number,
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

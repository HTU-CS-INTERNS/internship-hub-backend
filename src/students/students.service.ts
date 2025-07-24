import { EmailService } from '../email/email.service';
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
import { CheckInDto } from './dto/check-in.dto';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Retrieves the student's *active* internship.
   * This is intended for use where a single, current internship is expected (e.g., dashboard).
   * Returns the internship object or null if no active internship is found.
   */
  async getMyActiveInternship(userId: number) {
    const student = await this.prisma.students.findFirst({ where: { user_id: userId } });
    if (!student) {
        throw new NotFoundException('Student not found for fetching active internship.');
    }

    // Find the single active internship for this student.
    // Assuming 'status: "active"' defines the current, in-progress internship.
    const activeInternship = await this.prisma.internships.findFirst({
      where: {
        student_id: student.id,
        status: 'active', // Filter by active status
      },
      include: {
        companies: true,
        company_supervisors: { include: { users: true } },
        lecturers: { include: { users: true } },
      },
    });

    // This will correctly return the internship object or null if no active one is found.
    return activeInternship;
  }

  /**
   * Returns ALL internships associated with a student.
   * This method might be used for an "Internship History" or similar list.
   * It returns an array, which could be empty.
   */
  async getMyInternships(userId: number) {
    const student = await this.prisma.students.findFirst({ where: { user_id: userId } });
    if (!student) {
        throw new NotFoundException('Student not found for fetching all internships.');
    }
    return this.prisma.internships.findMany({
      where: { student_id: student.id },
      include: { // Include relations if needed for listing all internships
        companies: true,
        company_supervisors: { include: { users: true } },
        lecturers: { include: { users: true } },
      },
      orderBy: { start_date: 'desc' }, // Order them, e.g., by most recent
    });
  }

  /**
   * Retrieves the student's core profile information.
   * This is typically used for the 'api/students/me/profile' endpoint.
   */
  async getMyProfile(userId: number) {
    const student = await this.prisma.students.findFirst({
      where: { user_id: userId },
      include: {
        faculties: true,
        departments: true,
        users: { // Include the related User data directly here
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
            // profile_picture_url: true,
            // Add any other user fields you need for the profile
          }
        }
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    // You might want to flatten the user data into the student object
    const { users, ...studentWithoutUser } = student;
    return {
      ...studentWithoutUser,
      user: users // Expose user data under a clear key
    };
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
        { // Include search by email for users
            users: {
                email: {
                    contains: query.search,
 
                }
            }
        }
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
    // Check if student already exists in pending or active students
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

    const existingActiveStudent = await this.prisma.students.findFirst({
        where: { student_id_number: dto.student_id_number }
    });

    if (existingActiveStudent) {
        throw new ConflictException('Student with this ID number already has an active account.');
    }

    // Check if user already exists in the users table
    const existingUser = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists in the system.');
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

    // Send email with OTP
    const subject = 'Your Internship Hub Verification Code';
    const text = `Your OTP for student registration is: ${otpCode}. It will expire in 10 minutes.`;
    const html = `<p>Your OTP for student registration is: <strong>${otpCode}</strong></p><p>It will expire in 10 minutes.</p>`;
    await this.emailService.sendMail(email, subject, text, html);

    return {
      message: 'OTP sent successfully to your email',
      email,
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
            is_active: true, // Account is active upon verification
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
            profile_complete: false, // Initial state, can be updated later
          },
        });

        // Mark OTP as used
        await tx.otp_verifications.update({
          where: { id: otpRecord.id },
          data: { is_used: true },
        });

        // Mark pending student as verified (and potentially remove if not needed anymore)
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
      console.error('Error during account creation transaction:', error); // Log the error for debugging
      throw new BadRequestException('Failed to create account.');
    }
  }

  async checkIn(userId: number, dto: CheckInDto) {
    // 1. Find the student's active internship
    // Use getMyActiveInternship for consistent logic
    const internship = await this.getMyActiveInternship(userId);

    if (!internship) {
      throw new NotFoundException('No active internship found for this student. Cannot perform check-in.');
    }

    const company = internship.companies;

    if (!company.latitude || !company.longitude) {
      throw new BadRequestException('Company location is not set for the active internship. Cannot perform check-in.');
    }

    // 2. Calculate distance
    const distance = this.haversineDistance(
      { latitude: dto.latitude, longitude: dto.longitude },
      { latitude: company.latitude, longitude: company.longitude },
    );

    // 3. Check if within geofence
    const geofenceRadius = company.geofence_radius_meters || 100; // Default 100m
    const isWithinGeofence = distance <= geofenceRadius;

    // 4. Save check-in record
    return this.prisma.location_check_ins.create({
      data: {
        internship_id: internship.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        is_within_geofence: isWithinGeofence,
        // deviceInfo can be added later from request headers if needed
      },
    });
  }

  private haversineDistance(
    coords1: { latitude: number; longitude: number },
    coords2: { latitude: number; longitude: number },
  ): number {
    const toRad = (x) => (x * Math.PI) / 180;

    const R = 6371e3; // Earth's radius in metres
    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);
    const lat1 = toRad(coords1.latitude);
    const lat2 = toRad(coords2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // in metres

    return distance;
  }
}
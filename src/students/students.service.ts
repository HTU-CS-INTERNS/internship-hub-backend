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

  /**
   * Get student's activity data for dashboard analytics
   */
  async getActivityData(userId: number, period: string) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get check-ins data
    const checkIns = await this.prisma.location_check_ins.findMany({
      where: {
        internships: { student_id: student.id },
        check_in_timestamp: { gte: startDate },
      },
      orderBy: { check_in_timestamp: 'desc' },
    });

    // Get daily reports data
    const reports = await this.prisma.daily_reports.findMany({
      where: {
        internships: { student_id: student.id },
        submission_timestamp: { gte: startDate },
      },
      orderBy: { submission_timestamp: 'desc' },
    });

    // Get tasks data
    const tasks = await this.prisma.daily_tasks.findMany({
      where: {
        internships: { student_id: student.id },
        created_at: { gte: startDate },
      },
      orderBy: { created_at: 'desc' },
    });

    // Process data into chart-friendly format
    const chartData = this.processActivityChartData(checkIns, reports, tasks, period);

    return {
      checkInsCount: checkIns.length,
      reportsCount: reports.length,
      tasksCount: tasks.length,
      chartData,
      period,
    };
  }

  /**
   * Get student's dashboard metrics
   */
  async getDashboardMetrics(userId: number) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const internship = await this.getMyActiveInternship(userId);

    // Basic metrics
    const totalCheckIns = await this.prisma.location_check_ins.count({
      where: {
        internships: { student_id: student.id },
      },
    });

    const totalReports = await this.prisma.daily_reports.count({
      where: { 
        internships: { student_id: student.id },
      },
    });

    const totalTasks = await this.prisma.daily_tasks.count({
      where: { 
        internships: { student_id: student.id },
      },
    });

    const completedTasks = await this.prisma.daily_tasks.count({
      where: { 
        internships: { student_id: student.id },
        status: 'completed',
      },
    });

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get recent activity
    const recentCheckIns = await this.prisma.location_check_ins.findMany({
      where: {
        internships: { student_id: student.id },
      },
      orderBy: { check_in_timestamp: 'desc' },
      take: 5,
    });

    return {
      totalCheckIns,
      totalReports,
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate),
      internshipActive: !!internship,
      internshipStartDate: internship?.start_date,
      internshipEndDate: internship?.end_date,
      recentActivity: recentCheckIns.length,
    };
  }

  /**
   * Get student's progress data
   */
  async getProgressData(userId: number) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const internship = await this.getMyActiveInternship(userId);

    if (!internship) {
      return {
        overallProgress: 0,
        skillsProgress: [],
        milestonesProgress: [],
        weeklyProgress: [],
      };
    }

    // Calculate progress based on days elapsed
    const startDate = new Date(internship.start_date);
    const endDate = new Date(internship.end_date);
    const currentDate = new Date();

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(0, Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const overallProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

    // Get tasks for progress calculation
    const tasks = await this.prisma.daily_tasks.findMany({
      where: { 
        internships: { student_id: student.id },
      },
    });

    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const taskProgress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    return {
      overallProgress,
      taskProgress: Math.round(taskProgress),
      totalTasks: tasks.length,
      completedTasks,
      daysElapsed: elapsedDays,
      totalDays,
      skillsProgress: [], // Placeholder for future skills tracking
      milestonesProgress: [], // Placeholder for future milestones
    };
  }

  /**
   * Get student's documents
   */
  async getDocuments(userId: number) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // For now, return placeholder structure
    // In the future, this would connect to a documents table
    return {
      documents: [],
      message: 'Document management not yet implemented',
    };
  }

  /**
   * Upload a document (placeholder)
   */
  async uploadDocument(userId: number, uploadData: any) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Placeholder implementation
    return {
      success: false,
      message: 'Document upload not yet implemented',
    };
  }

  /**
   * Delete a document (placeholder)
   */
  async deleteDocument(userId: number, documentId: number) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return {
      success: false,
      message: 'Document deletion not yet implemented',
    };
  }

  /**
   * Get student's skills (placeholder)
   */
  async getSkills(userId: number) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return {
      skills: [],
      message: 'Skills tracking not yet implemented',
    };
  }

  /**
   * Update skill progress (placeholder)
   */
  async updateSkillProgress(userId: number, skillId: number, progressData: any) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return {
      success: false,
      message: 'Skill progress update not yet implemented',
    };
  }

  /**
   * Get student's milestones (placeholder)
   */
  async getMilestones(userId: number) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return {
      milestones: [],
      message: 'Milestones tracking not yet implemented',
    };
  }

  /**
   * Update milestone progress (placeholder)
   */
  async updateMilestoneProgress(userId: number, milestoneId: number, progressData: any) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return {
      success: false,
      message: 'Milestone progress update not yet implemented',
    };
  }

  /**
   * Get attendance records
   */
  async getAttendanceRecords(userId: number, startDate?: string, endDate?: string) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const whereClause: any = {
      internships: { student_id: student.id },
    };

    if (startDate && endDate) {
      whereClause.check_in_timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const checkIns = await this.prisma.location_check_ins.findMany({
      where: whereClause,
      include: {
        internships: {
          include: {
            companies: true,
          },
        },
      },
      orderBy: { check_in_timestamp: 'desc' },
    });

    // Transform check-ins into attendance records
    const attendanceRecords = checkIns.map(checkIn => ({
      id: checkIn.id,
      date: checkIn.check_in_timestamp.toISOString().split('T')[0],
      checkInTime: checkIn.check_in_timestamp,
      isWithinGeofence: checkIn.is_within_geofence,
      company: checkIn.internships.companies.name,
      location: {
        latitude: checkIn.latitude,
        longitude: checkIn.longitude,
      },
    }));

    return {
      records: attendanceRecords,
      total: attendanceRecords.length,
    };
  }

  /**
   * Submit attendance (placeholder for future implementation)
   */
  async submitAttendance(userId: number, attendanceData: any) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // For now, this redirects to check-in functionality
    // In the future, this could handle more complex attendance data
    return {
      success: true,
      message: 'Use check-in functionality for attendance tracking',
    };
  }

  /**
   * Helper method to process activity data into chart format
   */
  private processActivityChartData(checkIns: any[], reports: any[], tasks: any[], period: string) {
    const data: Array<{ date: string; checkIns: number; reports: number; tasks: number }> = [];
    const now = new Date();
    let groupBy: 'day' | 'week' | 'month' = 'day';

    switch (period) {
      case 'week':
        groupBy = 'day';
        break;
      case 'month':
        groupBy = 'day';
        break;
      case 'year':
        groupBy = 'month';
        break;
    }

    // Create date groups and count activities
    const groups = new Map<string, { checkIns: number; reports: number; tasks: number }>();

    [...checkIns, ...reports, ...tasks].forEach(item => {
      // Use appropriate timestamp field based on item type
      let timestamp: Date;
      if (item.check_in_timestamp) {
        timestamp = new Date(item.check_in_timestamp);
      } else if (item.submission_timestamp) {
        timestamp = new Date(item.submission_timestamp);
      } else if (item.created_at) {
        timestamp = new Date(item.created_at);
      } else {
        return; // Skip items without timestamp
      }

      let key: string;

      if (groupBy === 'day') {
        key = timestamp.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        // Default fallback to day format
        key = timestamp.toISOString().split('T')[0];
      }

      if (!groups.has(key)) {
        groups.set(key, { checkIns: 0, reports: 0, tasks: 0 });
      }

      const group = groups.get(key)!;
      if (checkIns.includes(item)) group.checkIns++;
      if (reports.includes(item)) group.reports++;
      if (tasks.includes(item)) group.tasks++;
    });

    // Convert to array format
    for (const [date, counts] of groups.entries()) {
      data.push({
        date,
        ...counts,
      });
    }

    return data.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get student's tasks from active internship
   */
  async getStudentTasks(userId: number, filters: { status?: string; date?: string }) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const whereClause: any = {
      internships: { student_id: student.id },
    };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.date) {
      const date = new Date(filters.date);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      whereClause.task_date = {
        gte: date,
        lt: nextDay,
      };
    }

    const tasks = await this.prisma.daily_tasks.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });

    return {
      tasks,
      total: tasks.length,
    };
  }

  /**
   * Create a new task for student
   */
  async createStudentTask(userId: number, taskData: any) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const internship = await this.getMyActiveInternship(userId);
    if (!internship) {
      throw new BadRequestException('No active internship found');
    }

    const task = await this.prisma.daily_tasks.create({
      data: {
        internship_id: internship.id,
        description: taskData.description || taskData.task_description,
        task_date: new Date(taskData.task_date || Date.now()),
        status: taskData.status || 'pending',
        expected_outcome: taskData.expected_outcome,
        learning_objective: taskData.learning_objective,
      },
    });

    return task;
  }

  /**
   * Update a student's task
   */
  async updateStudentTask(userId: number, taskId: number, taskData: any) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify the task belongs to this student
    const existingTask = await this.prisma.daily_tasks.findFirst({
      where: {
        id: taskId,
        internships: { student_id: student.id },
      },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found or does not belong to this student');
    }

    const updatedTask = await this.prisma.daily_tasks.update({
      where: { id: taskId },
      data: {
        description: taskData.description || taskData.task_description,
        status: taskData.status,
        expected_outcome: taskData.expected_outcome,
        learning_objective: taskData.learning_objective,
      },
    });

    return updatedTask;
  }

  /**
   * Delete a student's task
   */
  async deleteStudentTask(userId: number, taskId: number) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify the task belongs to this student
    const existingTask = await this.prisma.daily_tasks.findFirst({
      where: {
        id: taskId,
        internships: { student_id: student.id },
      },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found or does not belong to this student');
    }

    await this.prisma.daily_tasks.delete({
      where: { id: taskId },
    });

    return { success: true, message: 'Task deleted successfully' };
  }

  /**
   * Get student's reports
   */
  async getStudentReports(userId: number, filters: { status?: string; date?: string }) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const whereClause: any = {
      internships: { student_id: student.id },
    };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.date) {
      const date = new Date(filters.date);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      whereClause.report_date = {
        gte: date,
        lt: nextDay,
      };
    }

    const reports = await this.prisma.daily_reports.findMany({
      where: whereClause,
      orderBy: { submission_timestamp: 'desc' },
    });

    return {
      reports,
      total: reports.length,
    };
  }

  /**
   * Create a new report for student
   */
  async createStudentReport(userId: number, reportData: any) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const internship = await this.getMyActiveInternship(userId);
    if (!internship) {
      throw new BadRequestException('No active internship found');
    }

    const report = await this.prisma.daily_reports.create({
      data: {
        internship_id: internship.id,
        report_date: new Date(reportData.report_date || Date.now()),
        summary_of_work: reportData.summary_of_work || reportData.activities_performed,
        status: reportData.status || 'pending_review',
      },
    });

    return report;
  }

  /**
   * Update a student's report
   */
  async updateStudentReport(userId: number, reportId: number, reportData: any) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify the report belongs to this student
    const existingReport = await this.prisma.daily_reports.findFirst({
      where: {
        id: reportId,
        internships: { student_id: student.id },
      },
    });

    if (!existingReport) {
      throw new NotFoundException('Report not found or does not belong to this student');
    }

    const updatedReport = await this.prisma.daily_reports.update({
      where: { id: reportId },
      data: {
        summary_of_work: reportData.summary_of_work || reportData.activities_performed,
        status: reportData.status,
      },
    });

    return updatedReport;
  }

  /**
   * Delete a student's report
   */
  async deleteStudentReport(userId: number, reportId: number) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify the report belongs to this student
    const existingReport = await this.prisma.daily_reports.findFirst({
      where: {
        id: reportId,
        internships: { student_id: student.id },
      },
    });

    if (!existingReport) {
      throw new NotFoundException('Report not found or does not belong to this student');
    }

    await this.prisma.daily_reports.delete({
      where: { id: reportId },
    });

    return { success: true, message: 'Report deleted successfully' };
  }
}
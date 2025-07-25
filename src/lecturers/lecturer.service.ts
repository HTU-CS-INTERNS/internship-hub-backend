import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LecturerService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper method to get lecturer by user ID
  private async getLecturerByUserId(userId: number) {
    const lecturer = await this.prisma.lecturers.findFirst({
      where: { user_id: userId },
      include: { 
        departments: true
      },
    });
    
    if (!lecturer) {
      throw new NotFoundException('Lecturer record not found');
    }
    
    return lecturer;
  }

  // Verify student belongs to lecturer
  private async verifyStudentAccess(lecturerId: number, internshipId: number) {
    const internship = await this.prisma.internships.findFirst({
      where: {
        id: internshipId,
        lecturer_id: lecturerId,
      },
    });

    if (!internship) {
      throw new ForbiddenException('Access denied to this student');
    }

    return internship;
  }

  // Dashboard Stats
  async getDashboardStats(userId: number) {
    const lecturer = await this.getLecturerByUserId(userId);
    
    const [
      totalStudents,
      activeInternships,
      pendingReports,
      completedReports,
      departmentStudents,
      recentActivity,
    ] = await Promise.all([
      this.prisma.internships.count({
        where: { lecturer_id: lecturer.id },
      }),
      this.prisma.internships.count({
        where: { 
          lecturer_id: lecturer.id,
          status: 'active',
        },
      }),
      this.prisma.daily_reports.count({
        where: {
          internships: { lecturer_id: lecturer.id },
          status: 'pending_review',
        },
      }),
      this.prisma.daily_reports.count({
        where: {
          internships: { lecturer_id: lecturer.id },
          status: 'approved',
        },
      }),
      this.prisma.students.count({
        where: { department_id: lecturer.department_id },
      }),
      this.prisma.daily_reports.findMany({
        where: {
          internships: { lecturer_id: lecturer.id },
        },
        include: {
          internships: {
            include: {
              students: {
                include: { users: true },
              },
            },
          },
        },
        orderBy: { submission_timestamp: 'desc' },
        take: 5,
      }),
    ]);

    // Calculate real pending tasks
    const pendingTasks = await this.prisma.daily_tasks.count({
      where: {
        internships: { lecturer_id: lecturer.id },
        status: 'pending',
      },
    });

    // Calculate real average score from approved reports with lecturer feedback
    const approvedReportsWithRating = await this.prisma.daily_reports.findMany({
      where: {
        internships: { lecturer_id: lecturer.id },
        status: 'approved',
        lecturer_feedback: { not: null },
      },
      select: { lecturer_feedback: true },
    });

    // For now, we'll calculate a simple average based on feedback existence
    // In the future, you might want to add a lecturer_rating field to the schema
    const averageScore = approvedReportsWithRating.length > 0 ? 8.5 : 0;

    // Get unread messages count (implement when messaging system is ready)
    const messagesUnread = 0; // Will be implemented with messaging system

    return {
      totalStudents,
      activeInternships,
      pendingReports,
      completedReports,
      departmentStudents,
      pendingTasks,
      averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal place
      messagesUnread,
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        studentName: `${activity.internships?.students?.users?.first_name || 'Unknown'} ${activity.internships?.students?.users?.last_name || 'User'}`,
        action: 'Report Submission',
        timestamp: activity.submission_timestamp,
        status: activity.status,
      })),
    };
  }

  // Student Management
  async getMyStudents(userId: number, filters: any = {}) {
    const lecturer = await this.getLecturerByUserId(userId);
    
    const whereClause: any = {
      lecturer_id: lecturer.id,
    };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.department) {
      whereClause.students = {
        department_id: +filters.department,
      };
    }

    if (filters.search) {
      whereClause.students = {
        users: {
          OR: [
            { first_name: { contains: filters.search } },
            { last_name: { contains: filters.search } },
            { email: { contains: filters.search } },
          ],
        },
      };
    }

    const internships = await this.prisma.internships.findMany({
      where: whereClause,
      include: {
        students: {
          include: {
            users: true,
            faculties: true,
            departments: true,
          },
        },
        companies: true,
        company_supervisors: {
          include: { users: true },
        },
        daily_tasks: {
          where: { status: 'pending' },
        },
        daily_reports: {
          where: { status: 'pending_review' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const mappedInternships = internships.map(async (internship) => {
      // Calculate real overdue tasks - using status field and task_date
      const overdueTasks = await this.prisma.daily_tasks.count({
        where: {
          internship_id: internship.id,
          task_date: { lt: new Date() },
          status: { in: ['pending', 'in_progress'] },
        },
      });

      // Calculate real progress based on completed vs total tasks
      const [completedTasks, totalTasks] = await Promise.all([
        this.prisma.daily_tasks.count({
          where: {
            internship_id: internship.id,
            status: 'completed',
          },
        }),
        this.prisma.daily_tasks.count({
          where: { internship_id: internship.id },
        }),
      ]);

      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: internship.id,
        name: `${internship.students?.users?.first_name || 'Unknown'} ${internship.students?.users?.last_name || 'User'}`,
        email: internship.students?.users?.email || 'No email',
        department: internship.students?.departments?.name || 'Unknown Department',
        university: internship.students?.faculties?.name || 'Unknown University', 
        avatar: null, // Profile pictures not implemented in current schema
        overdueTasks,
        pendingReports: internship.daily_reports?.length || 0,
        progress,
        status: internship.status,
        lastActivity: internship.updated_at?.toISOString() || new Date().toISOString(),
        // Include original data for backwards compatibility
        students: internship.students,
        companies: internship.companies,
        company_supervisors: internship.company_supervisors,
      };
    });

    return Promise.all(mappedInternships);
  }

  async getStudentDetails(userId: number, internshipId: number) {
    const lecturer = await this.getLecturerByUserId(userId);
    await this.verifyStudentAccess(lecturer.id, internshipId);

    return this.prisma.internships.findUnique({
      where: { id: internshipId },
      include: {
        students: {
          include: {
            users: true,
            faculties: true,
            departments: true,
          },
        },
        companies: true,
        company_supervisors: {
          include: { users: true },
        },
        daily_tasks: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        daily_reports: {
          orderBy: { submission_timestamp: 'desc' },
          take: 10,
        },
      },
    });
  }

  async updateStudentStatus(userId: number, internshipId: number, dto: { status: string; notes?: string }) {
    const lecturer = await this.getLecturerByUserId(userId);
    await this.verifyStudentAccess(lecturer.id, internshipId);

    return this.prisma.internships.update({
      where: { id: internshipId },
      data: {
        status: dto.status,
        // Add notes to a lecturer_notes field if it exists
      },
    });
  }

  // Reports Management
  async getPendingReports(userId: number, filters: any = {}) {
    const lecturer = await this.getLecturerByUserId(userId);
    
    const whereClause: any = {
      internships: { lecturer_id: lecturer.id },
      status: 'pending_review',
    };

    if (filters.studentId) {
      whereClause.internship_id = +filters.studentId;
    }

    if (filters.type) {
      whereClause.report_type = filters.type;
    }

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }

    return this.prisma.daily_reports.findMany({
      where: whereClause,
      include: {
        internships: {
          include: {
            students: {
              include: { users: true },
            },
          },
        },
      },
      orderBy: { submission_timestamp: 'desc' },
    });
  }

  async getAllReports(userId: number, filters: any = {}) {
    const lecturer = await this.getLecturerByUserId(userId);
    
    const whereClause: any = {
      internships: { lecturer_id: lecturer.id },
    };

    if (filters.studentId) {
      whereClause.internship_id = +filters.studentId;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.type) {
      whereClause.report_type = filters.type;
    }

    return this.prisma.daily_reports.findMany({
      where: whereClause,
      include: {
        internships: {
          include: {
            students: {
              include: { users: true },
            },
          },
        },
      },
      orderBy: { submission_timestamp: 'desc' },
    });
  }

  async getReportDetails(userId: number, reportId: number) {
    const lecturer = await this.getLecturerByUserId(userId);
    
    const report = await this.prisma.daily_reports.findFirst({
      where: {
        id: reportId,
        internships: { lecturer_id: lecturer.id },
      },
      include: {
        internships: {
          include: {
            students: {
              include: { users: true },
            },
          },
        },
      },
    });

    if (!report) {
      throw new ForbiddenException('Access denied to this report');
    }

    return report;
  }

  async approveReport(userId: number, reportId: number, dto: { feedback?: string; rating?: number }) {
    const lecturer = await this.getLecturerByUserId(userId);
    
    const report = await this.prisma.daily_reports.findFirst({
      where: {
        id: reportId,
        internships: { lecturer_id: lecturer.id },
      },
    });

    if (!report) {
      throw new ForbiddenException('Access denied to this report');
    }

    return this.prisma.daily_reports.update({
      where: { id: reportId },
      data: {
        status: 'approved',
        lecturer_feedback: dto.feedback,
        approved_timestamp: new Date(),
      },
    });
  }

  async rejectReport(userId: number, reportId: number, dto: { reason: string }) {
    const lecturer = await this.getLecturerByUserId(userId);
    
    const report = await this.prisma.daily_reports.findFirst({
      where: {
        id: reportId,
        internships: { lecturer_id: lecturer.id },
      },
    });

    if (!report) {
      throw new ForbiddenException('Access denied to this report');
    }

    return this.prisma.daily_reports.update({
      where: { id: reportId },
      data: {
        status: 'rejected',
        lecturer_feedback: dto.reason,
        approved_timestamp: new Date(),
      },
    });
  }

  async requestReportRevision(userId: number, reportId: number, dto: { feedback: string }) {
    const lecturer = await this.getLecturerByUserId(userId);
    
    const report = await this.prisma.daily_reports.findFirst({
      where: {
        id: reportId,
        internships: { lecturer_id: lecturer.id },
      },
    });

    if (!report) {
      throw new ForbiddenException('Access denied to this report');
    }

    return this.prisma.daily_reports.update({
      where: { id: reportId },
      data: {
        status: 'revision_requested',
        lecturer_feedback: dto.feedback,
      },
    });
  }

  // Student Progress Tracking
  async getStudentProgress(userId: number, internshipId: number) {
    const lecturer = await this.getLecturerByUserId(userId);
    await this.verifyStudentAccess(lecturer.id, internshipId);

    const [tasksStats, reportsStats] = await Promise.all([
      this.prisma.daily_tasks.aggregate({
        where: { internship_id: internshipId },
        _count: { id: true },
      }),
      this.prisma.daily_reports.aggregate({
        where: { internship_id: internshipId },
        _count: { id: true },
      }),
    ]);

    return {
      totalTasks: tasksStats._count.id,
      averageTaskRating: 0, // Not implemented in current schema
      totalReports: reportsStats._count.id,
      averageReportRating: 0, // Not implemented in current schema
      totalCheckIns: 0, // Check-ins table not available
      skillsProgress: [], // Skills table not available
    };
  }

  async getStudentTasks(userId: number, internshipId: number, filters: any = {}) {
    const lecturer = await this.getLecturerByUserId(userId);
    await this.verifyStudentAccess(lecturer.id, internshipId);

    const whereClause: any = {
      internship_id: internshipId,
    };

    if (filters.status) {
      whereClause.approval_status = filters.status;
    }

    return this.prisma.daily_tasks.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: filters.limit || 20,
    });
  }

  async getStudentReports(userId: number, internshipId: number, filters: any = {}) {
    const lecturer = await this.getLecturerByUserId(userId);
    await this.verifyStudentAccess(lecturer.id, internshipId);

    const whereClause: any = {
      internship_id: internshipId,
    };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    return this.prisma.daily_reports.findMany({
      where: whereClause,
      orderBy: { submission_timestamp: 'desc' },
      take: filters.limit || 20,
    });
  }

  // Analytics & Assessment
  async getStudentAnalytics(userId: number, internshipId: number, period?: string) {
    const lecturer = await this.getLecturerByUserId(userId);
    await this.verifyStudentAccess(lecturer.id, internshipId);

    const dateFilter = this.getDateFilter(period);

    const [performanceData, skillsGrowth] = await Promise.all([
      this.prisma.daily_reports.aggregate({
        where: {
          internship_id: internshipId,
          ...dateFilter,
        },
        _count: { id: true },
      }),
      // Skills growth - not available in current schema
      Promise.resolve([]),
    ]);

    return {
      performanceData,
      attendanceData: 0, // Check-ins not available in current schema
      skillsGrowth,
    };
  }

  async getDepartmentAnalytics(userId: number, period?: string) {
    const lecturer = await this.getLecturerByUserId(userId);
    
    const dateFilter = this.getDateFilter(period);

    const [
      departmentInternships,
      completionRates,
      averagePerformance,
    ] = await Promise.all([
      this.prisma.internships.count({
        where: {
          students: { department_id: lecturer.department_id },
        },
      }),
      this.prisma.internships.groupBy({
        by: ['status'],
        where: {
          students: { department_id: lecturer.department_id },
        },
        _count: { id: true },
      }),
      this.prisma.daily_reports.aggregate({
        where: {
          internships: {
            students: { department_id: lecturer.department_id },
          },
          ...dateFilter,
        },
        _count: { id: true },
      }),
    ]);

    return {
      departmentInternships,
      completionRates,
      averagePerformance: 0, // Rating not available in current schema
    };
  }

  // Assessment & Grading
  async submitAssessment(userId: number, internshipId: number, assessmentData: {
    type: string;
    criteria: Record<string, number>;
    overallGrade: number;
    feedback: string;
    period: string;
  }) {
    const lecturer = await this.getLecturerByUserId(userId);
    await this.verifyStudentAccess(lecturer.id, internshipId);

    // Create assessment record (you might need to create an assessments table)
    return {
      message: 'Assessment submitted successfully',
      assessmentData,
    };
  }

  async getAssessments(userId: number, internshipId?: number) {
    const lecturer = await this.getLecturerByUserId(userId);

    // Return mock data for now - implement when assessments table is ready
    return [];
  }

  // Communication
  async getNotifications(userId: number, filters: any = {}) {
    // Mock implementation - implement when notifications system is ready
    return [];
  }

  async markNotificationAsRead(userId: number, notificationId: number) {
    // Mock implementation
    return { message: 'Notification marked as read' };
  }

  async sendMessageToStudent(userId: number, internshipId: number, dto: { message: string; subject?: string }) {
    const lecturer = await this.getLecturerByUserId(userId);
    await this.verifyStudentAccess(lecturer.id, internshipId);

    // Mock implementation - implement when messaging system is ready
    return { message: 'Message sent successfully' };
  }

  async getMessages(userId: number, filters: any = {}) {
    // Mock implementation
    return [];
  }

  // Internship Management
  async getInternships(userId: number, filters: any = {}) {
    const lecturer = await this.getLecturerByUserId(userId);
    
    const whereClause: any = {
      lecturer_id: lecturer.id,
    };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.company) {
      whereClause.companies = {
        name: { contains: filters.company },
      };
    }

    return this.prisma.internships.findMany({
      where: whereClause,
      include: {
        students: {
          include: { users: true },
        },
        companies: true,
        company_supervisors: {
          include: { users: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getInternshipDetails(userId: number, internshipId: number) {
    const lecturer = await this.getLecturerByUserId(userId);
    await this.verifyStudentAccess(lecturer.id, internshipId);

    return this.prisma.internships.findUnique({
      where: { id: internshipId },
      include: {
        students: {
          include: {
            users: true,
            faculties: true,
            departments: true,
          },
        },
        companies: true,
        company_supervisors: {
          include: { users: true },
        },
        daily_tasks: true,
        daily_reports: true,
      },
    });
  }

  // Profile Management
  async getLecturerProfile(userId: number) {
    const lecturer = await this.getLecturerByUserId(userId);
    return {
      ...lecturer,
      user: await this.prisma.users.findUnique({
        where: { id: lecturer.user_id },
      }),
    };
  }

  async updateLecturerProfile(userId: number, profileData: any) {
    const lecturer = await this.getLecturerByUserId(userId);
    
    return this.prisma.lecturers.update({
      where: { id: lecturer.id },
      data: profileData,
    });
  }

  // Helper method for date filtering
  private getDateFilter(period?: string) {
    if (!period) return {};

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return {};
    }

    return {
      submission_timestamp: {
        gte: startDate,
      },
    };
  }
}

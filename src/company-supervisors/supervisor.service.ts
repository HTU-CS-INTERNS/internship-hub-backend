import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupervisorService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper method to get supervisor by user ID
  private async getSupervisorByUserId(userId: number) {
    const supervisor = await this.prisma.company_supervisors.findUnique({
      where: { user_id: userId },
      include: { companies: true },
    });
    
    if (!supervisor) {
      throw new NotFoundException('Supervisor record not found');
    }
    
    return supervisor;
  }

  // Verify intern belongs to supervisor
  private async verifyInternAccess(supervisorId: number, internshipId: number) {
    const internship = await this.prisma.internships.findFirst({
      where: {
        id: internshipId,
        company_supervisor_id: supervisorId,
      },
    });

    if (!internship) {
      throw new ForbiddenException('Access denied to this intern');
    }

    return internship;
  }

  // Dashboard Stats
  async getDashboardStats(userId: number) {
    const supervisor = await this.getSupervisorByUserId(userId);
    
    const [
      totalInterns,
      activeInterns,
      totalTasks,
      completedTasks,
      pendingTasks,
      recentTaskActivity,
    ] = await Promise.all([
      // Total interns under this supervisor
      this.prisma.internships.count({
        where: { company_supervisor_id: supervisor.id },
      }),
      // Active internships
      this.prisma.internships.count({
        where: { 
          company_supervisor_id: supervisor.id,
          status: 'active',
        },
      }),
      // Total tasks assigned
      this.prisma.daily_tasks.count({
        where: {
          internships: { company_supervisor_id: supervisor.id },
        },
      }),
      // Completed tasks
      this.prisma.daily_tasks.count({
        where: {
          internships: { company_supervisor_id: supervisor.id },
          status: 'completed',
        },
      }),
      // Pending tasks (awaiting supervisor review/approval)
      this.prisma.daily_tasks.count({
        where: {
          internships: { company_supervisor_id: supervisor.id },
          status: 'pending',
        },
      }),
      // Recent task activity
      this.prisma.daily_tasks.findMany({
        where: {
          internships: { company_supervisor_id: supervisor.id },
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
        orderBy: { updated_at: 'desc' },
        take: 5,
      }),
    ]);

    // Calculate monthly hours based on check-ins
    const monthlyCheckIns = await this.prisma.location_check_ins.count({
      where: {
        internships: { company_supervisor_id: supervisor.id },
        check_in_timestamp: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const monthlyHours = monthlyCheckIns * 8; // Assume 8 hours per check-in day

    return {
      totalInterns,
      activeInterns,
      totalTasks,
      completedTasks,
      pendingTasks,
      tasksCompleted: completedTasks, // Frontend expects tasksCompleted
      activeTasks: totalTasks - completedTasks, // Frontend expects activeTasks
      pendingEvaluations: pendingTasks, // Tasks awaiting evaluation
      monthlyHours,
      averageRating: 0, // Will be calculated from task evaluations when rating system is implemented
      // Report-related metrics set to 0 since supervisors don't handle reports
      overdueReports: 0,
      pendingReports: 0,
      recentActivity: recentTaskActivity.map((task) => {
        const student = task.internships?.students;
        const user = student?.users;
        const userName = user ? `${user.first_name} ${user.last_name}` : 'Unknown Student';
        
        return {
          id: task.id,
          studentName: userName,
          action: 'Task Submission',
          timestamp: task.updated_at,
          status: task.status,
          description: task.description,
        };
      }),
    };
  }

  // Interns Management
  async getMyInterns(userId: number, filters: any = {}) {
    const supervisor = await this.getSupervisorByUserId(userId);
    
    const whereClause: any = {
      company_supervisor_id: supervisor.id,
    };

    if (filters.status) {
      whereClause.status = filters.status;
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
        daily_tasks: {
          select: {
            id: true,
            status: true,
          },
        },
        location_check_ins: {
          select: {
            id: true,
            check_in_timestamp: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return internships.map((internship) => {
      const user = internship.students?.users;
      
      // Calculate progress based only on tasks (supervisors don't handle reports)
      const totalTasks = internship.daily_tasks.length;
      const completedTasks = internship.daily_tasks.filter(t => t.status === 'completed').length;
      
      const progress = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      const userName = user ? `${user.first_name} ${user.last_name}` : 'Unknown User';

      return {
        id: internship.id,
        name: userName,
        university: internship.students?.faculties?.name || 'Unknown University',
        department: internship.students?.departments?.name || 'Unknown Department',
        avatar: null, // Will add profile_picture support when available in schema
        pendingTasks: internship.daily_tasks.filter(t => t.status === 'pending').length,
        pendingReports: 0, // Supervisors don't handle reports
        progress,
        status: internship.status,
        totalCheckIns: internship.location_check_ins.length,
        user: {
          name: userName,
          university: internship.students?.faculties?.name || 'Unknown University',
          avatar: null,
        },
        // Include original data for backwards compatibility
        students: internship.students,
        companies: internship.companies,
      };
    });
  }

  async getInternDetails(userId: number, internshipId: number) {
    const supervisor = await this.getSupervisorByUserId(userId);
    await this.verifyInternAccess(supervisor.id, internshipId);

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
        daily_tasks: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        daily_reports: {
          orderBy: { submission_timestamp: 'desc' },
          take: 10,
        },
        location_check_ins: {
          orderBy: { check_in_timestamp: 'desc' },
          take: 10,
        },
      },
    });
  }

  async updateInternStatus(userId: number, internshipId: number, dto: { status: string; notes?: string }) {
    const supervisor = await this.getSupervisorByUserId(userId);
    await this.verifyInternAccess(supervisor.id, internshipId);

    return this.prisma.internships.update({
      where: { id: internshipId },
      data: {
        status: dto.status,
        // Add notes to a supervisor_notes field if it exists
      },
    });
  }

  // Task Management - Supervisors handle only tasks, not reports
  async getPendingTasks(userId: number, filters: any = {}) {
    const supervisor = await this.getSupervisorByUserId(userId);
    
    const whereClause: any = {
      internships: { company_supervisor_id: supervisor.id },
      status: 'pending', // Tasks awaiting supervisor review
    };

    if (filters.internId) {
      whereClause.internship_id = +filters.internId;
    }

    if (filters.search) {
      whereClause.description = { contains: filters.search };
    }

    return this.prisma.daily_tasks.findMany({
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
      orderBy: { created_at: 'desc' },
    });
  }

  async approveTask(userId: number, taskId: number, dto: { feedback?: string; rating?: number }) {
    const supervisor = await this.getSupervisorByUserId(userId);
    
    // Verify task belongs to supervisor's intern
    const task = await this.prisma.daily_tasks.findFirst({
      where: {
        id: taskId,
        internships: { company_supervisor_id: supervisor.id },
      },
    });

    if (!task) {
      throw new ForbiddenException('Access denied to this task');
    }

    return this.prisma.daily_tasks.update({
      where: { id: taskId },
      data: {
        status: 'completed', // Mark as completed when approved
        // Note: feedback and rating fields need to be added to schema if required
        updated_at: new Date(),
      },
    });
  }

  async rejectTask(userId: number, taskId: number, dto: { reason: string }) {
    const supervisor = await this.getSupervisorByUserId(userId);
    
    const task = await this.prisma.daily_tasks.findFirst({
      where: {
        id: taskId,
        internships: { company_supervisor_id: supervisor.id },
      },
    });

    if (!task) {
      throw new ForbiddenException('Access denied to this task');
    }

    return this.prisma.daily_tasks.update({
      where: { id: taskId },
      data: {
        status: 'rejected',
        // Note: rejection reason field needs to be added to schema if required
        updated_at: new Date(),
      },
    });
  }

  async assignTask(userId: number, internshipId: number, taskData: {
    title: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
  }) {
    const supervisor = await this.getSupervisorByUserId(userId);
    await this.verifyInternAccess(supervisor.id, internshipId);

    return this.prisma.daily_tasks.create({
      data: {
        internship_id: internshipId,
        description: taskData.description, // Using actual column name
        task_date: new Date(taskData.dueDate), // Using actual column name
        // Note: priority field doesn't exist in schema - remove or add to schema
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  // Task Analytics & Performance - Supervisors focus on tasks only
  async getTaskStats(userId: number, filters: any = {}) {
    const supervisor = await this.getSupervisorByUserId(userId);

    const whereClause: any = {
      internships: { company_supervisor_id: supervisor.id },
    };

    if (filters.internId) {
      whereClause.internship_id = +filters.internId;
    }

    const taskStats = await this.prisma.daily_tasks.aggregate({
      where: whereClause,
      _count: { id: true },
      // Note: Rating fields need to be added to schema for evaluations
    });

    const checkInsCount = await this.prisma.location_check_ins.count({
      where: {
        internships: { company_supervisor_id: supervisor.id },
      },
    });

    return {
      totalTasks: taskStats._count.id,
      totalCheckIns: checkInsCount,
      monthlyHours: checkInsCount * 8, // Estimated hours
    };
  }

  async getInternTaskAnalytics(userId: number, internshipId: number) {
    const supervisor = await this.getSupervisorByUserId(userId);
    await this.verifyInternAccess(supervisor.id, internshipId);

    const taskStats = await this.prisma.daily_tasks.groupBy({
      by: ['status'],
      where: { internship_id: internshipId },
      _count: true,
    });

    const checkIns = await this.prisma.location_check_ins.findMany({
      where: { internship_id: internshipId },
      orderBy: { check_in_timestamp: 'desc' },
      take: 30,
    });

    return {
      taskStats,
      checkIns,
      totalCheckIns: checkIns.length,
    };
  }

  async getInternActivityLog(userId: number, internshipId: number, filters: any = {}) {
    const supervisor = await this.getSupervisorByUserId(userId);
    await this.verifyInternAccess(supervisor.id, internshipId);

    // Ensure limit is a number
    const limit = typeof filters.limit === 'string' 
      ? parseInt(filters.limit, 10) 
      : Number(filters.limit) || 15;

    // Get recent task and check-in activities
    const [tasks, checkIns] = await Promise.all([
      this.prisma.daily_tasks.findMany({
        where: { internship_id: internshipId },
        orderBy: { updated_at: 'desc' },
        take: limit, // Now using the properly converted number
      }),
      this.prisma.location_check_ins.findMany({
        where: { internship_id: internshipId },
        orderBy: { check_in_timestamp: 'desc' },
        take: limit, // Now using the properly converted number
      }),
    ]);

    // Combine and sort activities
    const activities = [
      ...tasks.map(t => ({ 
        type: 'task', 
        data: t, 
        timestamp: t.updated_at,
        description: t.description,
        status: t.status 
      })),
      ...checkIns.map(c => ({ 
        type: 'check-in', 
        data: c, 
        timestamp: c.check_in_timestamp,
        location: `${c.latitude}, ${c.longitude}`,
        isWithinGeofence: c.is_within_geofence 
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Ensure final limit is a number
    const finalLimit = typeof filters.limit === 'string' 
      ? parseInt(filters.limit, 10) 
      : Number(filters.limit) || 20;
    
    return activities.slice(0, finalLimit);
}

  // Task Evaluation & Assessment
  async evaluateTask(userId: number, taskId: number, evaluationData: {
    rating: number;
    feedback: string;
    skillsAssessment?: {
      technical: number;
      communication: number;
      initiative: number;
    };
  }) {
    const supervisor = await this.getSupervisorByUserId(userId);
    
    const task = await this.prisma.daily_tasks.findFirst({
      where: {
        id: taskId,
        internships: { company_supervisor_id: supervisor.id },
      },
    });

    if (!task) {
      throw new ForbiddenException('Access denied to this task');
    }

    // For now, just update the task status and add evaluation as comment
    // In future, create separate evaluations table
    return this.prisma.daily_tasks.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        // Note: Add evaluation fields to schema when implementing rating system
        updated_at: new Date(),
      },
    });
  }

  // Company Profile & Settings
  async getCompanyProfile(userId: number) {
    const supervisor = await this.getSupervisorByUserId(userId);
    return supervisor.companies;
  }

  async updateCompanyProfile(userId: number, profileData: any) {
    const supervisor = await this.getSupervisorByUserId(userId);
    
    return this.prisma.companies.update({
      where: { id: supervisor.company_id },
      data: profileData,
    });
  }

  async getSupervisorProfile(userId: number) {
    const supervisor = await this.getSupervisorByUserId(userId);
    return {
      ...supervisor,
      user: await this.prisma.users.findUnique({
        where: { id: supervisor.user_id },
      }),
    };
  }

  async updateSupervisorProfile(userId: number, profileData: any) {
    const supervisor = await this.getSupervisorByUserId(userId);
    
    return this.prisma.company_supervisors.update({
      where: { id: supervisor.id },
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
      updated_at: {
        gte: startDate,
      },
    };
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Dashboard Stats
  async getDashboardStats() {
    const [
      totalUsers,
      totalStudents,
      totalInternships,
      totalCompanies,
      pendingInternships,
      activeInternships,
      totalFaculties,
      totalDepartments
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.students.count(),
      this.prisma.internships.count(),
      this.prisma.companies.count(),
      this.prisma.internships.count({ where: { status: 'pending' } }),
      this.prisma.internships.count({ where: { status: 'active' } }),
      this.prisma.faculties.count(),
      this.prisma.departments.count()
    ]);

    return {
      totalUsers,
      totalStudents,
      totalInternships,
      totalCompanies,
      pendingInternships,
      activeInternships,
      totalFaculties,
      totalDepartments,
      systemHealth: 'healthy',
      lastUpdated: new Date().toISOString()
    };
  }

  // User Management
  async getAllUsers(query: {
    role?: string;
    status?: string;
    search?: string;
    page?: string;
    limit?: string;
  }) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (query.role) {
      where.role = query.role;
    }

    if (query.search) {
      where.OR = [
        { first_name: { contains: query.search } },
        { last_name: { contains: query.search } },
        { email: { contains: query.search } }
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      this.prisma.users.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async createUser(userData: any) {
    return this.prisma.users.create({
      data: userData
    });
  }

  async updateUser(id: number, userData: any) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.users.update({
      where: { id },
      data: userData
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.users.delete({ where: { id } });
  }

  // Faculty Management
  async getFaculties() {
    return this.prisma.faculties.findMany({
      include: {
        departments: true,
        _count: {
          select: {
            departments: true,
            students: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createFaculty(facultyData: any) {
    return this.prisma.faculties.create({
      data: facultyData
    });
  }

  async updateFaculty(id: number, facultyData: any) {
    const faculty = await this.prisma.faculties.findUnique({ where: { id } });
    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }

    return this.prisma.faculties.update({
      where: { id },
      data: facultyData
    });
  }

  async deleteFaculty(id: number) {
    const faculty = await this.prisma.faculties.findUnique({ where: { id } });
    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }

    // Check if faculty has departments
    const departmentCount = await this.prisma.departments.count({ where: { faculty_id: id } });
    if (departmentCount > 0) {
      throw new BadRequestException('Cannot delete faculty with existing departments');
    }

    return this.prisma.faculties.delete({ where: { id } });
  }

  // Department Management
  async getDepartments(facultyId?: number) {
    const where = facultyId ? { faculty_id: facultyId } : {};
    
    return this.prisma.departments.findMany({
      where,
      include: {
        faculties: true,
        _count: {
          select: {
            students: true,
            lecturers: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createDepartment(departmentData: any) {
    return this.prisma.departments.create({
      data: departmentData,
      include: { faculties: true }
    });
  }

  async updateDepartment(id: number, departmentData: any) {
    const department = await this.prisma.departments.findUnique({ where: { id } });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return this.prisma.departments.update({
      where: { id },
      data: departmentData,
      include: { faculties: true }
    });
  }

  async deleteDepartment(id: number) {
    const department = await this.prisma.departments.findUnique({ where: { id } });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Check if department has students
    const studentCount = await this.prisma.students.count({ where: { department_id: id } });
    if (studentCount > 0) {
      throw new BadRequestException('Cannot delete department with existing students');
    }

    return this.prisma.departments.delete({ where: { id } });
  }

  // Student Management
  async getStudents(query: {
    facultyId?: string;
    departmentId?: string;
    status?: string;
    search?: string;
    page?: string;
    limit?: string;
  }) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (query.facultyId) {
      where.faculty_id = parseInt(query.facultyId, 10);
    }
    
    if (query.departmentId) {
      where.department_id = parseInt(query.departmentId, 10);
    }

    if (query.search) {
      where.OR = [
        { student_id_number: { contains: query.search } },
        { users: { first_name: { contains: query.search } } },
        { users: { last_name: { contains: query.search } } },
        { users: { email: { contains: query.search } } }
      ];
    }

    const [students, total] = await Promise.all([
      this.prisma.students.findMany({
        where,
        skip,
        take: limit,
        include: {
          users: true,
          faculties: true,
          departments: true,
          internships: {
            include: {
              companies: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      this.prisma.students.count({ where })
    ]);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateStudent(id: number, studentData: any) {
    const student = await this.prisma.students.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.students.update({
      where: { id },
      data: studentData,
      include: {
        users: true,
        faculties: true,
        departments: true
      }
    });
  }

  async getPendingStudents() {
    return this.prisma.pending_students.findMany({
      orderBy: { created_at: 'desc' }
    });
  }

  // Company Management
  async getCompanies(query: {
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
        { address: { contains: query.search } }
      ];
    }

    const [companies, total] = await Promise.all([
      this.prisma.companies.findMany({
        where,
        skip,
        take: limit,
        include: {
          internships: {
            include: {
              students: {
                include: { users: true }
              }
            }
          },
          company_supervisors: {
            include: { users: true }
          },
          _count: {
            select: {
              internships: true,
              company_supervisors: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      this.prisma.companies.count({ where })
    ]);

    return {
      companies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async createCompany(companyData: any) {
    return this.prisma.companies.create({
      data: companyData
    });
  }

  async updateCompany(id: number, companyData: any) {
    const company = await this.prisma.companies.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.companies.update({
      where: { id },
      data: companyData
    });
  }

  async deleteCompany(id: number) {
    const company = await this.prisma.companies.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if company has active internships
    const activeInternships = await this.prisma.internships.count({ 
      where: { 
        company_id: id,
        status: 'active'
      } 
    });
    
    if (activeInternships > 0) {
      throw new BadRequestException('Cannot delete company with active internships');
    }

    return this.prisma.companies.delete({ where: { id } });
  }

  // System Management
  async getSystemStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayUsers,
      weekUsers,
      monthUsers,
      todayInternships,
      weekInternships,
      monthInternships
    ] = await Promise.all([
      this.prisma.user.count({ where: { created_at: { gte: startOfDay } } }),
      this.prisma.user.count({ where: { created_at: { gte: startOfWeek } } }),
      this.prisma.user.count({ where: { created_at: { gte: startOfMonth } } }),
      this.prisma.internship.count({ where: { created_at: { gte: startOfDay } } }),
      this.prisma.internship.count({ where: { created_at: { gte: startOfWeek } } }),
      this.prisma.internship.count({ where: { created_at: { gte: startOfMonth } } })
    ]);

    return {
      users: {
        today: todayUsers,
        week: weekUsers,
        month: monthUsers
      },
      internships: {
        today: todayInternships,
        week: weekInternships,
        month: monthInternships
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    };
  }

  async getSystemHealth() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async getSystemLogs(query: {
    level?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  }) {
    // This would typically integrate with a logging service
    // For now, return mock data
    return {
      logs: [
        {
          id: 1,
          level: 'info',
          message: 'System started successfully',
          timestamp: new Date().toISOString(),
          module: 'system'
        },
        {
          id: 2,
          level: 'warn',
          message: 'High memory usage detected',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          module: 'system'
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        pages: 1
      }
    };
  }

  // Analytics
  async getAnalyticsData(period: string) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const [
      userRegistrations,
      internshipApplications,
      completedInternships
    ] = await Promise.all([
      this.prisma.user.count({ where: { created_at: { gte: startDate } } }),
      this.prisma.internship.count({ where: { created_at: { gte: startDate } } }),
      this.prisma.internship.count({ 
        where: { 
          created_at: { gte: startDate },
          status: 'completed'
        } 
      })
    ]);

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      metrics: {
        userRegistrations,
        internshipApplications,
        completedInternships
      }
    };
  }

  async exportReport(reportType: string, filters?: any) {
    // This would generate and return report data
    return {
      reportType,
      filters,
      generatedAt: new Date().toISOString(),
      downloadUrl: `/reports/${reportType}-${Date.now()}.csv`
    };
  }

  // Settings
  async getSystemSettings() {
    // This would typically fetch from a settings table
    return {
      maintenance_mode: false,
      registration_enabled: true,
      email_notifications: true,
      system_name: 'Internship Hub',
      max_file_size: 10485760, // 10MB
      allowed_file_types: ['pdf', 'doc', 'docx', 'jpg', 'png']
    };
  }

  async updateSystemSettings(settings: any) {
    // This would typically update a settings table
    return {
      ...settings,
      updated_at: new Date().toISOString()
    };
  }

  // Real-time Stats
  async getRealtimeStats() {
    const [
      onlineUsers,
      todayCheckins,
      pendingSubmissions
    ] = await Promise.all([
      // This would typically query active sessions
      Promise.resolve(42), // Mock data
      this.prisma.checkIn.count({
        where: {
          check_in_timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      this.prisma.internship.count({ where: { status: 'pending' } })
    ]);

    return {
      onlineUsers,
      todayCheckins,
      pendingSubmissions,
      timestamp: new Date().toISOString()
    };
  }

  // Abuse Reports (Mock implementation)
  async getAbuseReports(query: any) {
    // This would typically query an abuse_reports table
    return {
      reports: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    };
  }

  async updateAbuseReport(id: number, updateData: any) {
    // Mock implementation
    return {
      id,
      ...updateData,
      updated_at: new Date().toISOString()
    };
  }

  async updateAbuseReportStatus(id: number, status: string) {
    // Mock implementation
    return {
      id,
      status,
      updated_at: new Date().toISOString()
    };
  }
}

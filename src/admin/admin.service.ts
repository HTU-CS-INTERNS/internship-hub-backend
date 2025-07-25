import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFacultyDto } from '../faculties/dto/create-faculty.dto';

interface PendingStudentData {
  student_id_number: string;
  email: string;
  first_name: string;
  last_name: string;
  faculty_id: number;
  department_id: number;
  program_of_study?: string;
}

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

  // Faculty Management
 // Faculty Management
async getFaculties() {
  return this.prisma.faculties.findMany({
    include: {
      _count: {
        select: {
          students: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}

async createFaculty(facultyData: CreateFacultyDto) {
  // Validate faculty name is unique
  const existingFaculty = await this.prisma.faculties.findFirst({
    where: { name: facultyData.name }
  });
  
  if (existingFaculty) {
    throw new BadRequestException('Faculty with this name already exists');
  }

  return this.prisma.faculties.create({
    data: {
      name: facultyData.name
    }
  });
}

async updateFaculty(id: number, facultyData: Partial<CreateFacultyDto>) {
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

  const departmentCount = await this.prisma.departments.count({ 
    where: { faculty_id: id } 
  });
  
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
    const { faculty_id, facultyId, ...rest } = departmentData;
    
    // Handle both camelCase (facultyId) and snake_case (faculty_id) inputs
    const finalFacultyId = faculty_id || facultyId;
    
    if (!finalFacultyId) {
      throw new BadRequestException('Faculty ID is required');
    }
    
    // Validate that the faculty exists
    const faculty = await this.prisma.faculties.findUnique({
      where: { id: parseInt(finalFacultyId, 10) }
    });
    
    if (!faculty) {
      throw new BadRequestException('Faculty not found');
    }
    
    return this.prisma.departments.create({
      data: {
        ...rest,
        faculty_id: parseInt(finalFacultyId, 10) // Use correct field name
      }
    });
  }

  async updateDepartment(id: number, departmentData: any) {
    const department = await this.prisma.departments.findUnique({ where: { id } });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Map camelCase to snake_case for database
    const { facultyId, ...rest } = departmentData;
    const updateData = { ...rest };
    
    // Only add faculty_id if facultyId was provided
    if (facultyId !== undefined) {
      updateData.faculty_id = parseInt(facultyId, 10);
    }

    return this.prisma.departments.update({
      where: { id },
      data: updateData
    });
  }

  async deleteDepartment(id: number) {
    const department = await this.prisma.departments.findUnique({ where: { id } });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

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
        orderBy: { id: 'desc' }
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

  // Pending Student Management
  async getPendingStudents() {
    return this.prisma.pending_students.findMany({
      include: {
        faculties: true,
        departments: true,
        admin: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async createPendingStudent(studentData: PendingStudentData, adminId: number) {
    // Validate faculty exists
    const faculty = await this.prisma.faculties.findUnique({
      where: { id: studentData.faculty_id }
    });
    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }

    // Validate department exists and belongs to faculty
    const department = await this.prisma.departments.findUnique({
      where: { id: studentData.department_id }
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    if (department.faculty_id !== studentData.faculty_id) {
      throw new BadRequestException('Department does not belong to the specified faculty');
    }

    // Check for existing student ID
    const existingStudent = await this.prisma.students.findUnique({
      where: { student_id_number: studentData.student_id_number }
    });
    const existingPending = await this.prisma.pending_students.findUnique({
      where: { student_id_number: studentData.student_id_number }
    });

    if (existingStudent || existingPending) {
      throw new BadRequestException('Student ID already exists');
    }

    // Check for existing email
    const existingUser = await this.prisma.users.findUnique({
      where: { email: studentData.email }
    });
    const existingPendingEmail = await this.prisma.pending_students.findFirst({
      where: { email: studentData.email }
    });

    if (existingUser || existingPendingEmail) {
      throw new BadRequestException('Email already exists');
    }

    // Create pending student record
    return this.prisma.pending_students.create({
      data: {
        ...studentData,
        added_by_admin_id: adminId,
        program_of_study: studentData.program_of_study || null,
        is_verified: false
      }
    });
  }

  async bulkCreatePendingStudents(students: PendingStudentData[], adminId: number) {
    const errors: string[] = [];
    const validStudents: PendingStudentData[] = [];

    for (const [index, student] of students.entries()) {
      try {
        // Check for existing student ID
        const [existingPending, existingStudent] = await Promise.all([
          this.prisma.pending_students.findUnique({
            where: { student_id_number: student.student_id_number }
          }),
          this.prisma.students.findUnique({
            where: { student_id_number: student.student_id_number }
          })
        ]);

        if (existingPending || existingStudent) {
          throw new Error(`Student ID ${student.student_id_number} already exists`);
        }

        // Check for existing email
        const [existingPendingEmail, existingUser] = await Promise.all([
          this.prisma.pending_students.findFirst({
            where: { email: student.email }
          }),
          this.prisma.users.findUnique({
            where: { email: student.email }
          })
        ]);

        if (existingPendingEmail || existingUser) {
          throw new Error(`Email ${student.email} already exists`);
        }

        // Validate faculty and department
        const [faculty, department] = await Promise.all([
          this.prisma.faculties.findUnique({
            where: { id: student.faculty_id }
          }),
          this.prisma.departments.findUnique({
            where: { id: student.department_id }
          })
        ]);

        if (!faculty) throw new Error(`Faculty ID ${student.faculty_id} not found`);
        if (!department) throw new Error(`Department ID ${student.department_id} not found`);
        if (department.faculty_id !== student.faculty_id) {
          throw new Error(`Department doesn't belong to Faculty`);
        }

        validStudents.push(student);
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Some students failed validation',
        errors,
        validCount: validStudents.length,
        errorCount: errors.length
      });
    }

    // Create all valid pending students
    const createdStudents = await this.prisma.$transaction(
      validStudents.map(student => 
        this.prisma.pending_students.create({
          data: {
            ...student,
            added_by_admin_id: adminId,
            program_of_study: student.program_of_study || null,
            is_verified: false
          }
        })
      )
    );

    return {
      success: true,
      count: createdStudents.length,
      students: createdStudents
    };
  }

  async deletePendingStudent(id: number) {
    const pendingStudent = await this.prisma.pending_students.findUnique({ 
      where: { id }
    });
    if (!pendingStudent) {
      throw new NotFoundException('Pending student not found');
    }

    return this.prisma.pending_students.delete({ where: { id } });
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
      this.prisma.users.count({ where: { created_at: { gte: startOfDay } } }),
      this.prisma.users.count({ where: { created_at: { gte: startOfWeek } } }),
      this.prisma.users.count({ where: { created_at: { gte: startOfMonth } } }),
      this.prisma.internships.count({ where: { created_at: { gte: startOfDay } } }),
      this.prisma.internships.count({ where: { created_at: { gte: startOfWeek } } }),
      this.prisma.internships.count({ where: { created_at: { gte: startOfMonth } } })
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
      this.prisma.users.count({ where: { created_at: { gte: startDate } } }),
      this.prisma.internships.count({ where: { created_at: { gte: startDate } } }),
      this.prisma.internships.count({ 
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
      this.prisma.location_check_ins.count({
        where: {
          check_in_timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      this.prisma.internships.count({ where: { status: 'pending' } })
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

  // User Management Methods
  async createUser(userData: any) {
    const { email, password, ...rest } = userData;
    
    // Check if user already exists
    const existingUser = await this.prisma.users.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.users.create({
      data: {
        ...rest,
        email,
        password: hashedPassword,
        is_active: true, // Admin created users are auto-activated
        created_at: new Date(),
        update_at: new Date()
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        created_at: true,
        update_at: true
      }
    });
  }

  async updateUser(id: number, userData: any) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...rest } = userData;
    const updateData: any = { ...rest, update_at: new Date() };

    // Hash new password if provided
    if (password) {
      const bcrypt = require('bcrypt');
      updateData.password = await bcrypt.hash(password, 10);
    }

    return this.prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        created_at: true,
        update_at: true
      }
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has related records that would prevent deletion
    const [studentRecord, lecturerRecord, supervisorRecord] = await Promise.all([
      this.prisma.students.findFirst({ where: { user_id: id } }),
      this.prisma.lecturers.findFirst({ where: { user_id: id } }),
      this.prisma.company_supervisors.findFirst({ where: { user_id: id } })
    ]);

    if (studentRecord || lecturerRecord || supervisorRecord) {
      throw new BadRequestException('Cannot delete user with existing student, lecturer, or supervisor records');
    }

    await this.prisma.users.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }


}

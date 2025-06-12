import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateStudentDto } from './dto/update-student.dto';
import { VerifyStudentDto } from './dto/verify-student.dto';
import { Prisma } from '@prisma/client';

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
}

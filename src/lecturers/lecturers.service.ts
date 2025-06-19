import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LecturersService {
  constructor(private readonly prisma: PrismaService) {}

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
}

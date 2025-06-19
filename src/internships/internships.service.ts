import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignLecturerDto } from './dto/assign-lecturer.dto';

@Injectable()
export class InternshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async createInternship(dto: CreateInternshipDto) {
    return this.prisma.internships.create({
      data: {
        ...dto,
        status: dto.status || 'active',
      },
    });
  }

  async getInternshipById(id: number) {
    const internship = await this.prisma.internships.findUnique({
      where: { id },
      include: {
        students: { include: { users: true } },
        companies: true,
        company_supervisors: { include: { users: true } },
        lecturers: { include: { users: true } },
      },
    });

    if (!internship) throw new NotFoundException('Internship not found');
    return internship;
  }

  async getMyInternships(userId: number, role: string) {
    switch (role) {
      case 'student':
        return this.prisma.internships.findMany({
          where: { students: { user_id: userId } },
          include: { companies: true, company_supervisors: true },
        });
      case 'lecturer':
        return this.prisma.internships.findMany({
          where: { lecturers: { user_id: userId } },
          include: { students: true, companies: true },
        });
      case 'company_supervisor':
        return this.prisma.internships.findMany({
          where: { company_supervisors: { user_id: userId } },
          include: { students: true, companies: true },
        });
      default:
        return [];
    }
  }

  async assignLecturer(id: number, dto: AssignLecturerDto) {
    return this.prisma.internships.update({
      where: { id },
      data: { lecturer_id: dto.lecturer_id },
    });
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    return this.prisma.internships.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}

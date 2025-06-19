// src/company-supervisors/company-supervisors.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanySupervisorDto } from './dto/create-company-supervisor.dto';
// import { UpdateCompanySupervisorDto } from './dto/update-company-supervisor.dto';
import { UpdateMyCompanySupervisorProfileDto } from './dto/update-my-profile.dto';

@Injectable()
export class CompanySupervisorsService {
  constructor(private readonly prisma: PrismaService) {}

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
}

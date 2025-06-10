import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from '../departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '../departments/dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: CreateDepartmentDto) {
    return this.prisma.departments.create({
      data,
    });
  }
  findAll(faculty_id?: number) {
    return this.prisma.departments.findMany({
      where: faculty_id ? { faculty_id } : undefined,
    });
  }

  findOne(id: number) {
    return this.prisma.departments.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateDepartmentDto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.departments.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Ensure exists
    return this.prisma.departments.delete({ where: { id } });
  }
}

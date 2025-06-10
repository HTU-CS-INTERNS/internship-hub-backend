import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from '../departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '../departments/dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: CreateDepartmentDto) {
    const { faculty_id, name, hod_id } = data;

    return this.prisma.departments.create({
      data: {
        faculty_id,
        name,
        ...(typeof hod_id === 'number' ? { hod_id } : {}), // ✅ omit if not a number
      },
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

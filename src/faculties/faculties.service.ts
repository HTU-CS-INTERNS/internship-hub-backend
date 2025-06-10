import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFacultyDto } from '../faculties/dto/create-faculty.dto';
import { UpdateFacultyDto } from '../faculties/dto/update-faculty.dto';

@Injectable()
export class FacultiesService {
  constructor(private prisma: PrismaService) {}

  // Create a new faculty
  async create(data: CreateFacultyDto) {
    return this.prisma.faculties.create({ data });
  }

  // Retrieve all faculties
  async findAll() {
    return this.prisma.faculties.findMany();
  }

  // Retrieve a single faculty by ID
  async findOne(id: number) {
    const faculty = await this.prisma.faculties.findUnique({ where: { id } });
    if (!faculty) throw new NotFoundException('Faculty not found');
    return faculty;
  }

  // Update a faculty by ID
  async update(id: number, data: UpdateFacultyDto) {
    return this.prisma.faculties.update({
      where: { id },
      data,
    });
  }

  // Delete a faculty by ID
  async remove(id: number) {
    return this.prisma.faculties.delete({ where: { id } });
  }
}

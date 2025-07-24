// src/companies/companies.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new company
  async createCompany(dto: CreateCompanyDto) {
    return this.prisma.companies.create({
      data: {
        ...dto,
        latitude: dto.latitude
          ? Number(dto.latitude)
          : undefined,
        longitude: dto.longitude
          ? Number(dto.longitude)
          : undefined,
        geofence_radius_meters: dto.geofence_radius_meters
          ? Number(dto.geofence_radius_meters)
          : undefined,
      },
    });
  }

  // Get all companies with optional search filters
  async getAllCompanies(query: { search?: string }) {
    const { search } = query;

    return this.prisma.companies.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { industry: { contains: search } },
              { city: { contains: search } },
              { region: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { created_at: 'desc' },
    });
  }

  // Get a single company by ID
  async getCompanyById(id: number) {
    const company = await this.prisma.companies.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  // Update a company's details
  async updateCompany(id: number, dto: UpdateCompanyDto) {
    const company = await this.prisma.companies.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.companies.update({
      where: { id },
      data: {
        ...dto,
        latitude: dto.latitude
          ? Number(dto.latitude)
          : undefined,
        longitude: dto.longitude
          ? Number(dto.longitude)
          : undefined,
        geofence_radius_meters: dto.geofence_radius_meters
          ? Number(dto.geofence_radius_meters)
          : undefined,
      },
    });
  }
}

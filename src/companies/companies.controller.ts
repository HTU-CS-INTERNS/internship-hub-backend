// src/companies/companies.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // Create a new company (Admin only)
  @Post()
  @Roles('admin')
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.companiesService.createCompany(dto);
  }

  // Get all companies (Admin, Lecturers, Company Supervisors)
  @Get()
  @Roles('admin', 'lecturer', 'company_supervisor')
  getAllCompanies(@Query('search') search?: string) {
    return this.companiesService.getAllCompanies({ search });
  }

  // Get specific company by ID
  @Get(':id')
  @Roles('admin', 'lecturer', 'company_supervisor')
  getCompanyById(@Param('id') id: string) {
    return this.companiesService.getCompanyById(+id);
  }

  // Update a company (Admin only)
  @Put(':id')
  @Roles('admin')
  updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.updateCompany(+id, dto);
  }
}

// src/company-supervisors/company-supervisors.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CompanySupervisorsService } from './company-supervisors.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateCompanySupervisorDto } from './dto/create-company-supervisor.dto';
import { UpdateMyCompanySupervisorProfileDto } from './dto/update-my-profile.dto';
import { Request } from 'express';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('api/company-supervisors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanySupervisorsController {
  constructor(
    private readonly companySupervisorsService: CompanySupervisorsService,
  ) {}

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateCompanySupervisorDto) {
    return this.companySupervisorsService.create(dto);
  }

  @Get('me/profile')
  @Roles('company_supervisor')
  getMyProfile(@Req() req: Request & { user: AuthUser }) {
    return this.companySupervisorsService.getMyProfile(req.user.id);
  }

  @Put('me/profile')
  @Roles('company_supervisor')
  updateMyProfile(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: UpdateMyCompanySupervisorProfileDto,
  ) {
    return this.companySupervisorsService.updateMyProfile(req.user.id, dto);
  }

  @Get('me/interns')
  @Roles('company_supervisor')
  getMyInterns(@Req() req: Request & { user: AuthUser }) {
    return this.companySupervisorsService.getMyInterns(req.user.id);
  }

  @Get(':id/profile')
  @Roles('admin', 'lecturer')
  getSupervisorProfile(@Param('id') id: string) {
    return this.companySupervisorsService.getSupervisorProfile(+id);
  }
}

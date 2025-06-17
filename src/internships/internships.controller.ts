import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InternshipsService } from './internships.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignLecturerDto } from './dto/assign-lecturer.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('api/internships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternshipsController {
  constructor(private readonly internshipService: InternshipsService) {}

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateInternshipDto) {
    return this.internshipService.createInternship(dto);
  }

  @Get('me')
  @Roles('student', 'lecturer', 'company_supervisor')
  getMine(@Req() req: Request & { user: AuthUser }) {
    return this.internshipService.getMyInternships(req.user.id, req.user.role);
  }

  @Get(':id')
  @Roles('admin', 'student', 'lecturer', 'company_supervisor')
  getById(@Param('id') id: string) {
    return this.internshipService.getInternshipById(+id);
  }

  @Put(':id/assign-lecturer')
  @Roles('admin')
  assignLecturer(@Param('id') id: string, @Body() dto: AssignLecturerDto) {
    return this.internshipService.assignLecturer(+id, dto);
  }

  @Put(':id/status')
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.internshipService.updateStatus(+id, dto);
  }
}

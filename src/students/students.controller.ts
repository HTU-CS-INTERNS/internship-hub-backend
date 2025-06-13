import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateStudentDto } from './dto/update-student.dto';
import { VerifyStudentDto } from './dto/verify-student.dto';
import { Request } from 'express';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('api/students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me/profile')
  @Roles('student')
  getMyProfile(@Req() req: Request & { user: AuthUser }) {
    return this.studentsService.getMyProfile(req.user.id);
  }

  @Put('me/profile')
  @Roles('student')
  updateMyProfile(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.updateMyProfile(req.user.id, dto);
  }

  @Get()
  @Roles('admin', 'hod', 'lecturer')
  getAllStudents(
    @Query()
    query: {
      faculty_id?: string;
      department_id?: string;
      is_verified?: string;
      search?: string;
    },
  ) {
    return this.studentsService.getAllStudents(query);
  }

  @Get(':id/profile')
  @Roles('admin', 'hod', 'lecturer', 'company_supervisor')
  getStudentProfile(@Param('id') id: string) {
    return this.studentsService.getStudentProfile(+id);
  }

  @Put(':id/verify')
  @Roles('admin')
  verifyStudent(@Param('id') id: string, @Body() dto: VerifyStudentDto) {
    return this.studentsService.verifyStudent(+id, dto);
  }
}

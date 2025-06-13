import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Post,
} from '@nestjs/common';
import { LecturersService } from './lecturers.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { AssignStudentDto } from './dto/assign-student.dto';
import { Request } from 'express';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('api/lecturers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LecturersController {
  constructor(private readonly lecturersService: LecturersService) {}

  @Get('me/profile')
  @Roles('lecturer')
  getMyProfile(@Req() req: Request & { user: AuthUser }) {
    return this.lecturersService.getMyProfile(req.user.id);
  }

  @Put('me/profile')
  @Roles('lecturer')
  updateMyProfile(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: UpdateLecturerDto,
  ) {
    return this.lecturersService.updateMyProfile(req.user.id, dto);
  }

  @Get()
  @Roles('admin', 'hod')
  getAllLecturers(@Query() query: any) {
    return this.lecturersService.getAllLecturers(query);
  }

  @Get(':id/profile')
  @Roles('admin', 'hod')
  getLecturerProfile(@Param('id') id: string) {
    return this.lecturersService.getLecturerProfile(+id);
  }

  @Post(':lecturerId/assign-student')
  @Roles('admin')
  assignStudent(
    @Param('lecturerId') lecturerId: string,
    @Body() dto: AssignStudentDto,
  ) {
    return this.lecturersService.assignStudent(+lecturerId, dto.student_id);
  }

  @Get('me/students')
  @Roles('lecturer')
  getAssignedStudents(@Req() req: Request & { user: AuthUser }) {
    return this.lecturersService.getAssignedStudents(req.user.id);
  }
}

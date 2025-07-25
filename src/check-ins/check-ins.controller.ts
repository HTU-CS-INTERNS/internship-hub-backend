import { Controller, Post, Get, Put, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CheckInsService } from './check-ins.service';
import { CheckInDto } from '../students/dto/check-in.dto';
import { Request } from 'express';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('api/check-ins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post()
  @Roles('student')
  createCheckIn(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: CheckInDto,
  ) {
    return this.checkInsService.createCheckIn(req.user.id, dto);
  }

  @Get()
  getCheckIns(
    @Req() req: Request & { user: AuthUser },
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    const userRole = req.user.role;
    
    if (userRole === 'student') {
      return this.checkInsService.getCheckInsByUserId(req.user.id);
    } else if (userRole === 'company_supervisor') {
      return this.checkInsService.getCheckInsForSupervisorReview(req.user.id.toString(), status);
    } else if (userRole === 'admin' || userRole === 'lecturer') {
      if (studentId) {
        return this.checkInsService.getCheckInsByStudentId(studentId);
      }
      return this.checkInsService.getAllCheckIns();
    }
    
    return [];
  }

  @Put(':id/verify')
  @Roles('company_supervisor', 'admin')
  verifyCheckIn(
    @Param('id') id: string,
    @Req() req: Request & { user: AuthUser },
    @Body() body: { status: string; comments?: string },
  ) {
    return this.checkInsService.verifyCheckIn(
      parseInt(id, 10),
      req.user.id,
      body.status,
      body.comments,
    );
  }

  @Put(':id')
  @Roles('company_supervisor', 'admin')
  updateCheckInStatus(
    @Param('id') id: string,
    @Req() req: Request & { user: AuthUser },
    @Body() body: { supervisor_verification_status: string; supervisor_comments?: string },
  ) {
    return this.checkInsService.verifyCheckIn(
      parseInt(id, 10),
      req.user.id,
      body.supervisor_verification_status,
      body.supervisor_comments,
    );
  }
}

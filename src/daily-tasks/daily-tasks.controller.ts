import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { DailyTasksService } from './daily-tasks.service';
import { CreateDailyTaskDto } from './dto/create-daily-task.dto';
import { UpdateDailyTaskDto } from './dto/update-daily-task.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('api/internships/:internshipId/daily-tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyTasksController {
  constructor(private readonly dailyTasksService: DailyTasksService) {}

  @Post()
  @Roles('student')
  createDailyTask(
    @Param('internshipId', ParseIntPipe) internshipId: number,
    @Body() dto: CreateDailyTaskDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.dailyTasksService.createDailyTask(
      internshipId,
      dto,
      req.user.id,
    );
  }

  @Get()
  @Roles('student', 'lecturer', 'company_supervisor', 'admin')
  getDailyTasks(
    @Param('internshipId', ParseIntPipe) internshipId: number,
    @Query('task_date') taskDate?: string,
  ) {
    return this.dailyTasksService.getDailyTasks(internshipId, taskDate);
  }

  @Get(':taskId')
  @Roles('student', 'lecturer', 'company_supervisor', 'admin')
  getDailyTask(
    @Param('internshipId', ParseIntPipe) internshipId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.dailyTasksService.getDailyTask(internshipId, taskId);
  }

  @Put(':taskId')
  @Roles('student')
  updateDailyTask(
    @Param('internshipId', ParseIntPipe) internshipId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateDailyTaskDto,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.dailyTasksService.updateDailyTask(
      internshipId,
      taskId,
      dto,
      req.user.id,
    );
  }

  @Delete(':taskId')
  @Roles('student')
  deleteDailyTask(
    @Param('internshipId', ParseIntPipe) internshipId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: Request & { user: AuthUser },
  ) {
    return this.dailyTasksService.deleteDailyTask(
      internshipId,
      taskId,
      req.user.id,
    );
  }
}

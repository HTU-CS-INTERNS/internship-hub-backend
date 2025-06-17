import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDailyTaskDto } from './dto/create-daily-task.dto';
import { UpdateDailyTaskDto } from './dto/update-daily-task.dto';

@Injectable()
export class DailyTasksService {
  constructor(private readonly prisma: PrismaService) {}

  // Create new daily task
  async createDailyTask(
    internshipId: number,
    dto: CreateDailyTaskDto,
    userId: number,
  ) {
    const internship = await this.prisma.internships.findUnique({
      where: { id: internshipId },
    });

    if (!internship || internship.student_id !== userId) {
      throw new ForbiddenException(
        'You are not allowed to create a task for this internship.',
      );
    }

    return this.prisma.daily_tasks.create({
      data: {
        internship_id: internshipId,
        task_date: new Date(dto.task_date),
        description: dto.description,
        expected_outcome: dto.expected_outcome,
        learning_objective: dto.learning_objective,
      },
    });
  }

  // Get all daily tasks for internship (optionally filter by date)
  async getDailyTasks(internshipId: number, taskDate?: string) {
    return this.prisma.daily_tasks.findMany({
      where: {
        internship_id: internshipId,
        ...(taskDate && { task_date: new Date(taskDate) }),
      },
    });
  }

  // Get single daily task
  async getDailyTask(internshipId: number, taskId: number) {
    const task = await this.prisma.daily_tasks.findFirst({
      where: {
        id: taskId,
        internship_id: internshipId,
      },
    });

    if (!task) throw new NotFoundException('Daily task not found');
    return task;
  }

  // Update a daily task
  async updateDailyTask(
    internshipId: number,
    taskId: number,
    dto: UpdateDailyTaskDto,
    userId: number,
  ) {
    const task = await this.prisma.daily_tasks.findFirst({
      where: {
        id: taskId,
        internship_id: internshipId,
      },
      include: {
        internships: true,
      },
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.internships.student_id !== userId) {
      throw new ForbiddenException('You are not allowed to update this task.');
    }

    return this.prisma.daily_tasks.update({
      where: { id: taskId },
      data: { ...dto },
    });
  }

  // Delete a daily task
  async deleteDailyTask(internshipId: number, taskId: number, userId: number) {
    const task = await this.prisma.daily_tasks.findFirst({
      where: {
        id: taskId,
        internship_id: internshipId,
      },
      include: {
        internships: true,
      },
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.internships.student_id !== userId) {
      throw new ForbiddenException('You are not allowed to delete this task.');
    }

    return this.prisma.daily_tasks.delete({
      where: { id: taskId },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get reminders for a student
   */
  async getStudentReminders(userId: number) {
    const student = await this.prisma.students.findFirst({ 
      where: { user_id: userId } 
    });

    if (!student) {
      return { reminders: [], total: 0 };
    }

    const today = new Date();

    // Get active internship
    const internship = await this.prisma.internships.findFirst({
      where: {
        student_id: student.id,
        status: 'active',
      },
      include: {
        companies: true,
      },
    });

    const reminders: any[] = [];

    if (internship) {
      // Check-in reminders (if no check-in today)
      const todayCheckIn = await this.prisma.location_check_ins.findFirst({
        where: {
          internship_id: internship.id,
          check_in_timestamp: {
            gte: new Date(today.toDateString()),
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!todayCheckIn) {
        reminders.push({
          id: 'checkin-reminder',
          type: 'check_in',
          title: 'Daily Check-in Required',
          message: `Don't forget to check in at ${internship.companies.name}`,
          priority: 'high',
          dueDate: today,
          isOverdue: true,
        });
      }

      // Daily report reminders
      const todayReport = await this.prisma.daily_reports.findFirst({
        where: {
          internship_id: internship.id,
          report_date: {
            gte: new Date(today.toDateString()),
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!todayReport) {
        reminders.push({
          id: 'report-reminder',
          type: 'daily_report',
          title: 'Daily Report Due',
          message: 'Submit your daily internship report',
          priority: 'medium',
          dueDate: today,
          isOverdue: false,
        });
      }

      // Upcoming deadlines (internship end)
      const internshipEndDate = new Date(internship.end_date);
      const daysUntilEnd = Math.ceil((internshipEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilEnd <= 7 && daysUntilEnd > 0) {
        reminders.push({
          id: 'internship-ending',
          type: 'internship_deadline',
          title: 'Internship Ending Soon',
          message: `Your internship ends in ${daysUntilEnd} days. Prepare your final report.`,
          priority: 'high',
          dueDate: internshipEndDate,
          isOverdue: false,
        });
      }

      // Overdue tasks
      const overdueTasks = await this.prisma.daily_tasks.findMany({
        where: {
          internship_id: internship.id,
          status: { not: 'completed' },
          task_date: { lt: today },
        },
      });

      overdueTasks.forEach((task) => {
        reminders.push({
          id: `overdue-task-${task.id}`,
          type: 'overdue_task',
          title: 'Overdue Task',
          message: `Task: ${task.description}`,
          priority: 'high',
          dueDate: task.task_date,
          isOverdue: true,
        });
      });
    }

    return {
      reminders,
      total: reminders.length,
    };
  }

  /**
   * Mark a reminder as dismissed/read
   */
  async dismissReminder(userId: number, reminderId: string) {
    // For now, this is a placeholder
    // In a full implementation, you'd store dismissed reminders in the database
    return {
      success: true,
      message: 'Reminder dismissed',
    };
  }

  /**
   * Get reminder settings for a student
   */
  async getReminderSettings(userId: number) {
    // Placeholder for reminder preferences
    return {
      checkInReminders: true,
      reportReminders: true,
      taskReminders: true,
      deadlineReminders: true,
      emailNotifications: false,
    };
  }

  /**
   * Update reminder settings
   */
  async updateReminderSettings(userId: number, settings: any) {
    // Placeholder for updating reminder preferences
    return {
      success: true,
      message: 'Reminder settings updated',
      settings,
    };
  }
}

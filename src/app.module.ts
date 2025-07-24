import { EmailModule } from './email/email.module';
import { DepartmentsModule } from './departments/departments.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FacultiesModule } from './faculties/faculties.module';
import { LecturersModule } from './lecturers/lecturers.module';
import { InternshipsModule } from './internships/internships.module';
import { StudentsModule } from './students/students.module';
import { DailyTasksModule } from './daily-tasks/daily-tasks.module';
import { DailyReportsModule } from './daily_reports/daily_reports.module';
import { CompanySupervisorsModule } from './company-supervisors/company-supervisors.module';
import { CompaniesModule } from './companies/companies.module';
import { CheckInsModule } from './check-ins/check-ins.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config available globally
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    FacultiesModule,
    DepartmentsModule,
    LecturersModule,
    InternshipsModule,
    StudentsModule,
    DailyTasksModule,
    DailyReportsModule,
    CompanySupervisorsModule,
    CompaniesModule,
    CheckInsModule,
    AdminModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

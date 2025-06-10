import { DepartmentsModule } from './departments/departments.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module'; // Updated import path
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FacultiesModule } from './faculties/faculties.module';

@Module({
  imports: [
    PrismaModule, // Add this
    AuthModule,
    UsersModule,
    FacultiesModule,
    DepartmentsModule,
  ],
})
export class AppModule {}

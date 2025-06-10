import { Module } from '@nestjs/common';
import { FacultiesService } from './faculties.service';
import { FacultiesController } from './faculties.controller';
import { PrismaService } from '../../prisma/prisma.service'; // Import Prisma service to access the database

@Module({
  // Register the controller responsible for handling HTTP requests
  controllers: [FacultiesController],

  // Register services to handle business logic and database interaction
  providers: [FacultiesService, PrismaService],
})
export class FacultiesModule {}

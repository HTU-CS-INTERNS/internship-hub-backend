import { Module } from '@nestjs/common';
import { InternshipsService } from './internships.service';
import { InternshipsController } from './internships.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [InternshipsController],
  providers: [InternshipsService, PrismaService],
})
export class InternshipsModule {}

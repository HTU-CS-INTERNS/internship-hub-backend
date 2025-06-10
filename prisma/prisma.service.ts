import {
  INestApplication,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super(); // Ensures `this` is correctly typed
  }

  async onModuleInit(): Promise<void> {
    await this.$connect(); // Safe: PrismaClient exposes $connect
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect(); // Safe
  }

  enableShutdownHooks(app: INestApplication): void {
    process.on('beforeExit', () => {
      void app.close().catch((error: unknown) => {
        console.error('Error during app.close():', error);
      });
    });
  }
}

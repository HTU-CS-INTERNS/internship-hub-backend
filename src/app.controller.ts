import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getApiStatus(): any {
    return {
      name: 'Internship Hub API',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }
}

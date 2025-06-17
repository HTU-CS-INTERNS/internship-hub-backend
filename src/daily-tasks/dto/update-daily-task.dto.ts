import { PartialType } from '@nestjs/mapped-types';
import { CreateDailyTaskDto } from './create-daily-task.dto';

export class UpdateDailyTaskDto extends PartialType(CreateDailyTaskDto) {}

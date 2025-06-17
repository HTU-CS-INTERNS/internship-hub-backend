import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDailyTaskDto {
  @IsDateString()
  task_date: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  // Optional for phase 2
  @IsOptional()
  @IsString()
  expected_outcome?: string;

  @IsOptional()
  @IsString()
  learning_objective?: string;
}

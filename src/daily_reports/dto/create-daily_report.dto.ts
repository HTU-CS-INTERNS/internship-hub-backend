import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDailyReportDto {
  @IsDateString()
  report_date: string;

  @IsString()
  @IsNotEmpty()
  summary_of_work: string;

  @IsOptional()
  @IsString()
  related_task_ids?: string;
}

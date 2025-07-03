import { IsOptional, IsString } from 'class-validator';

export class UpdateDailyReportDto {
  @IsOptional()
  @IsString()
  summary_of_work?: string;

  @IsOptional()
  @IsString()
  related_task_ids?: string;
}

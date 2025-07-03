import { IsOptional, IsString } from 'class-validator';

export class RejectReportDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

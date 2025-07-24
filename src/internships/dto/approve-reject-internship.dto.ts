import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum InternshipApprovalStatus {
  PENDING = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export class ApproveRejectInternshipDto {
  @IsEnum(InternshipApprovalStatus)
  status: InternshipApprovalStatus;

  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;
}

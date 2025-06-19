import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(['completed', 'cancelled'])
  status: 'completed' | 'cancelled';
}

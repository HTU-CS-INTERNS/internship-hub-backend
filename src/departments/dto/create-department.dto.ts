import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @IsInt()
  faculty_id: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  hod_id?: number;
}

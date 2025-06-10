import { IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateFacultyDto {
  @IsNotEmpty() // name is required
  name: string;

  @IsOptional() // dean_id is optional
  @IsInt() // must be a number if provided
  dean_id?: number;
}

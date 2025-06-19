import { IsInt } from 'class-validator';

export class AssignLecturerDto {
  @IsInt()
  lecturer_id: number;
}

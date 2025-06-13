// src/lecturers/dto/assign-student.dto.ts
import { IsInt } from 'class-validator';

export class AssignStudentDto {
  @IsInt()
  student_id: number;
}

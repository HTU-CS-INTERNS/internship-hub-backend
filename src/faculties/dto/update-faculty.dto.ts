import { PartialType } from '@nestjs/mapped-types';
import { CreateFacultyDto } from '../../faculties/dto/create-faculty.dto';

export class UpdateFacultyDto extends PartialType(CreateFacultyDto) {}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FacultiesService } from './faculties.service';
import { CreateFacultyDto } from '../faculties/dto/create-faculty.dto';
import { UpdateFacultyDto } from '../faculties/dto/update-faculty.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard'; // Auth guard for route protection
import { RolesGuard } from '../auth/roles.guard'; // Role-based access control
import { Roles } from '../auth/roles.decorator'; // Custom @Roles decorator

@Controller('api/faculties') // Base route for faculties API
export class FacultiesController {
  constructor(private readonly facultiesService: FacultiesService) {}

  // POST /api/faculties - Create a new faculty (Admin only)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateFacultyDto) {
    return this.facultiesService.create(dto);
  }

  // GET /api/faculties - Get all faculties (Authenticated users)
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.facultiesService.findAll();
  }

  // GET /api/faculties/:id - Get one faculty by ID (Authenticated users)
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.facultiesService.findOne(id);
  }

  // PUT /api/faculties/:id - Update a faculty by ID (Admin only)
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFacultyDto) {
    return this.facultiesService.update(id, dto);
  }

  // DELETE /api/faculties/:id - Delete a faculty (Admin only)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.facultiesService.remove(id);
  }
}

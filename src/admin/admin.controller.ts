import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard Stats
  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // User Management
  @Get('users')
  getAllUsers(@Query() query: {
    role?: string;
    status?: string;
    search?: string;
    page?: string;
    limit?: string;
  }) {
    return this.adminService.getAllUsers(query);
  }

  @Post('users')
  createUser(@Body() userData: any) {
    return this.adminService.createUser(userData);
  }

  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() userData: any) {
    return this.adminService.updateUser(+id, userData);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(+id);
  }

  // Faculty Management
  @Get('faculties')
  getFaculties() {
    return this.adminService.getFaculties();
  }

  @Post('faculties')
  createFaculty(@Body() facultyData: any) {
    return this.adminService.createFaculty(facultyData);
  }

  @Put('faculties/:id')
  updateFaculty(@Param('id') id: string, @Body() facultyData: any) {
    return this.adminService.updateFaculty(+id, facultyData);
  }

  @Delete('faculties/:id')
  deleteFaculty(@Param('id') id: string) {
    return this.adminService.deleteFaculty(+id);
  }

  // Department Management
  @Get('departments')
  getDepartments(@Query('facultyId') facultyId?: string) {
    return this.adminService.getDepartments(facultyId ? +facultyId : undefined);
  }

  @Post('departments')
  createDepartment(@Body() departmentData: any) {
    return this.adminService.createDepartment(departmentData);
  }

  @Put('departments/:id')
  updateDepartment(@Param('id') id: string, @Body() departmentData: any) {
    return this.adminService.updateDepartment(+id, departmentData);
  }

  @Delete('departments/:id')
  deleteDepartment(@Param('id') id: string) {
    return this.adminService.deleteDepartment(+id);
  }

  // Student Management
  @Get('students')
  getStudents(@Query() query: {
    facultyId?: string;
    departmentId?: string;
    status?: string;
    search?: string;
    page?: string;
    limit?: string;
  }) {
    return this.adminService.getStudents(query);
  }

  @Put('students/:id')
  updateStudent(@Param('id') id: string, @Body() studentData: any) {
    return this.adminService.updateStudent(+id, studentData);
  }

  @Get('students/pending')
  getPendingStudents() {
    return this.adminService.getPendingStudents();
  }

  // Company Management
  @Get('companies')
  getCompanies(@Query() query: {
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    return this.adminService.getCompanies(query);
  }

  @Post('companies')
  createCompany(@Body() companyData: any) {
    return this.adminService.createCompany(companyData);
  }

  @Put('companies/:id')
  updateCompany(@Param('id') id: string, @Body() companyData: any) {
    return this.adminService.updateCompany(+id, companyData);
  }

  @Delete('companies/:id')
  deleteCompany(@Param('id') id: string) {
    return this.adminService.deleteCompany(+id);
  }

  // System Management
  @Get('system/stats')
  getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Get('system/health')
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('system/logs')
  getSystemLogs(@Query() query: {
    level?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  }) {
    return this.adminService.getSystemLogs(query);
  }

  // Analytics
  @Get('analytics')
  getAnalyticsData(@Query('period') period: string = 'month') {
    return this.adminService.getAnalyticsData(period);
  }

  @Post('reports/export')
  exportReport(@Body() data: { reportType: string; filters?: any }) {
    return this.adminService.exportReport(data.reportType, data.filters);
  }

  // Settings
  @Get('settings')
  getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Put('settings')
  updateSystemSettings(@Body() settings: any) {
    return this.adminService.updateSystemSettings(settings);
  }

  // Real-time Stats
  @Get('realtime/stats')
  getRealtimeStats() {
    return this.adminService.getRealtimeStats();
  }

  // Abuse Reports
  @Get('abuse-reports')
  getAbuseReports(@Query() query: {
    status?: string;
    priority?: string;
    page?: string;
    limit?: string;
  }) {
    return this.adminService.getAbuseReports(query);
  }

  @Put('abuse-reports/:id')
  updateAbuseReport(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateAbuseReport(+id, updateData);
  }

  @Put('abuse-reports/:id/status')
  updateAbuseReportStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.adminService.updateAbuseReportStatus(+id, data.status);
  }
}

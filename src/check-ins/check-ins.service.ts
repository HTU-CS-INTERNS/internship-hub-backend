import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckInDto } from '../students/dto/check-in.dto';

@Injectable()
export class CheckInsService {
  constructor(private prisma: PrismaService) {}

  async createCheckIn(userId: number, dto: CheckInDto) {
    // Get student from user
    const student = await this.prisma.students.findUnique({
      where: { user_id: userId },
      include: {
        internships: {
          where: { status: 'active' },
          include: { companies: true }
        }
      }
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const activeInternship = student.internships;
    if (!activeInternship) {
      throw new NotFoundException('No active internship found for this student. Cannot perform check-in.');
    }

    if (!activeInternship.companies?.latitude || !activeInternship.companies?.longitude) {
      throw new BadRequestException('Company location is not set for the active internship. Cannot perform check-in.');
    }

    // Calculate distance if GPS coordinates are provided
    let isWithinGeofence = true;
    if (dto.latitude && dto.longitude) {
      const distance = this.calculateDistance(
        Number(dto.latitude),
        Number(dto.longitude),
        Number(activeInternship.companies.latitude),
        Number(activeInternship.companies.longitude)
      );
      isWithinGeofence = distance <= 100; // 100 meters tolerance
    }

    // Create check-in record - Note: Using available fields from location_check_ins table
    const checkIn = await this.prisma.location_check_ins.create({
      data: {
        internship_id: activeInternship.id,
        check_in_timestamp: dto.check_in_timestamp ? new Date(dto.check_in_timestamp) : new Date(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        is_within_geofence: dto.is_outside_geofence !== undefined ? !dto.is_outside_geofence : isWithinGeofence,
        device_info: 'Web Application',
      },
      include: {
        internships: {
          include: { 
            companies: true,
            students: {
              include: { users: true }
            }
          }
        }
      }
    });

    // Transform to frontend expected format
    return this.transformCheckInResponse(checkIn, dto);
  }

  async getCheckInsByUserId(userId: number) {
    const student = await this.prisma.students.findUnique({
      where: { user_id: userId }
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.getCheckInsByInternshipId(student.id);
  }

  async getCheckInsByStudentId(studentId: string) {
    const student = await this.prisma.students.findUnique({
      where: { id: parseInt(studentId, 10) }
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.getCheckInsByInternshipId(student.id);
  }

  private async getCheckInsByInternshipId(studentId: number) {
    const internship = await this.prisma.internships.findFirst({
      where: { 
        student_id: studentId,
        status: 'active'
      }
    });

    if (!internship) {
      return [];
    }

    const checkIns = await this.prisma.location_check_ins.findMany({
      where: {
        internship_id: internship.id
      },
      include: {
        internships: {
          include: { 
            companies: true,
            students: {
              include: { users: true }
            }
          }
        }
      },
      orderBy: {
        check_in_timestamp: 'desc'
      }
    });

    return checkIns.map(checkIn => this.transformCheckInResponse(checkIn));
  }

  async getCheckInsForSupervisorReview(supervisorUserId: string, status: string = 'PENDING') {
    // Find internships supervised by this supervisor
    const supervisor = await this.prisma.company_supervisors.findUnique({
      where: { user_id: parseInt(supervisorUserId, 10) },
      include: { companies: true }
    });

    if (!supervisor) {
      return [];
    }

    const internships = await this.prisma.internships.findMany({
      where: {
        company_id: supervisor.company_id
      }
    });

    const internshipIds = internships.map(i => i.id);

    const checkIns = await this.prisma.location_check_ins.findMany({
      where: {
        internship_id: {
          in: internshipIds
        }
      },
      include: {
        internships: {
          include: { 
            companies: true,
            students: {
              include: { users: true }
            }
          }
        }
      },
      orderBy: {
        check_in_timestamp: 'desc'
      }
    });

    return checkIns.map(checkIn => this.transformCheckInResponse(checkIn));
  }

  async getAllCheckIns() {
    const checkIns = await this.prisma.location_check_ins.findMany({
      include: {
        internships: {
          include: { 
            companies: true,
            students: {
              include: { users: true }
            }
          }
        }
      },
      orderBy: {
        check_in_timestamp: 'desc'
      }
    });

    return checkIns.map(checkIn => this.transformCheckInResponse(checkIn));
  }

  async verifyCheckIn(checkInId: number, supervisorUserId: number, status: string, comments?: string) {
    const checkIn = await this.prisma.location_check_ins.findUnique({
      where: { id: checkInId },
      include: {
        internships: {
          include: {
            companies: {
              include: {
                company_supervisors: true
              }
            },
            students: {
              include: { users: true }
            }
          }
        }
      }
    });

    if (!checkIn) {
      throw new NotFoundException('Check-in not found');
    }

    // Verify supervisor has permission to verify this check-in
    const hasPermission = checkIn.internships.companies.company_supervisors.some(
      supervisor => supervisor.user_id === supervisorUserId
    );

    if (!hasPermission) {
      throw new BadRequestException('You do not have permission to verify this check-in');
    }

    // Return the check-in with updated verification status
    // Note: Since location_check_ins doesn't have supervisor verification fields,
    // we return the formatted response with the verification info
    const updatedCheckIn = {
      ...checkIn,
      supervisor_verification_status: status.toUpperCase(),
      supervisor_comments: comments,
      verified_at: new Date().toISOString(),
      verified_by: supervisorUserId
    };

    return this.transformCheckInResponse(updatedCheckIn);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
  }

  private transformCheckInResponse(checkIn: any, dto?: CheckInDto) {
    return {
      id: checkIn.id.toString(),
      student_id: checkIn.internships?.students?.id?.toString() || '',
      check_in_timestamp: checkIn.check_in_timestamp,
      created_at: checkIn.check_in_timestamp, // Using check_in_timestamp as created_at
      latitude: Number(checkIn.latitude),
      longitude: Number(checkIn.longitude),
      address_resolved: dto?.address_resolved || null,
      manual_reason: dto?.manual_reason || null,
      is_gps_verified: dto?.is_gps_verified || true,
      is_outside_geofence: !checkIn.is_within_geofence,
      photo_url: dto?.photo_url || null,
      supervisor_verification_status: checkIn.supervisor_verification_status || 'PENDING',
      supervisor_comments: checkIn.supervisor_comments || null,
    };
  }
}

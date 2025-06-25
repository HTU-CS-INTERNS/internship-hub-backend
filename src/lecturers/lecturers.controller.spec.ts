/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { LecturersController } from './lecturers.controller';
import { LecturersService } from './lecturers.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Request } from 'express';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';


describe('LecturersController', () => {
  let controller: LecturersController;
  let service: LecturersService;

  // Mock data setup
  const mockUser: AuthUser = {
    id: 1,
    email: 'joeregan@htu.edu.gh',
    role: 'student',
  };

  const mockRequest = {
    user: mockUser,
  } as unknown as Request & { user: AuthUser };

  const mockProfile = {
    id: 1,
    name: 'Joe Regan',
    email: 'joeregan@htu.edu.gh',
    department: 'Computer Science',
  };

  // Service mock with proper implementations
  const mockLecturersService = {
    getMyProfile: jest.fn().mockResolvedValue(mockProfile),
    updateMyProfile: jest.fn().mockResolvedValue(mockProfile),
    getAllLecturers: jest.fn().mockResolvedValue(mockProfile),
    getlecturerprofile: jest.fn(),
    assignstudent: jest.fn(),
    getAssignedStudents: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LecturersController],
      providers: [
        {
          provide: LecturersService,
          useValue: mockLecturersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get<LecturersController>(LecturersController);
    service = moduleRef.get<LecturersService>(LecturersService);
    jest.clearAllMocks(); // Reset mocks between tests
  });

  describe('getMyProfile', () => {
    it('should return the authenticated lecturer profile', async () => {
      const result = await controller.getMyProfile(mockRequest);
      expect(result).toEqual(mockProfile);
      expect(service.getMyProfile).toHaveBeenCalledWith(mockUser.id);
    });
  });
  describe('updateMyProfile', () => {
    it('should update my profile', async () => {
      const mockUpdateDto = { department_id: 1 }; // Provide appropriate fields if needed
      await controller.updateMyProfile(mockRequest, mockUpdateDto);
    });
  });
  describe('getAllLecturers', () => {
    it('should get all lecturers', async () => {
      return expect(await controller.getAllLecturers(mockRequest));
    });
  });
});

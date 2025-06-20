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

  const mockUser = {
    id: 1,
    email: 'joeregan@htu.edu.gh',
    role: 'Lecturer',
  };
  const mockRequest = {
    user: mockUser,
  } as unknown as Request & { user: AuthUser };

  const mockLecturersService = {
    getMyprofile: jest.fn().mockResolvedValue({
      mockRequest,
    } as unknown as Request & {
      user: AuthUser;
    }),
    updateMyProfile: jest.fn().mockResolvedValue({}),
    getAllLecturers: jest.fn().mockResolvedValue([]),
    getlecturerprofile: jest.fn().mockResolvedValue({}),
    assignstudent: jest.fn().mockResolvedValue({}),
    getAssignedStudents: jest.fn().mockResolvedValue([]),
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
      .overrideProvider(LecturersService)
      .useValue(mockLecturersService)
      .compile();

    controller = moduleRef.get<LecturersController>(LecturersController);
    service = moduleRef.get<LecturersService>(LecturersService);
  });
  it('should get user profile', async () => {
    return expect(
      await controller.getMyProfile({ mockRequest } as unknown as Request & {
        user: AuthUser;
      }),
    ).toEqual({
      u,
    });
  });
});

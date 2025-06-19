import { Test } from '@nestjs/testing';
import { LecturersController } from './lecturers.controller';
import { LecturersService } from './lecturers.service';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

describe('LecturersController', () => {
  let controller: LecturersController;

  const mockLecturersService = {
    getMyprofile: jest.fn().mockResolvedValue({
      id: 1,
      user: 'Ben',
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
  });
  it('should get user profile', async () => {
    return expect(await controller.getMyProfile({user:AuthUser;}))
  });
});

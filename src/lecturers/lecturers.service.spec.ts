import { Test, TestingModule } from '@nestjs/testing';
import { LecturersService } from './lecturers.service';
import { LecturersController } from './lecturers.controller';
import { PrismaService } from 'prisma/prisma.service';

describe('LecturersService', () => {
  let service: LecturersService;
  let controller: LecturersController;

  const 
  const mockLecturersRepository = {
    Lecturers: {
      getMyProfile: jest.fn().mockResolvedValue(),
      updateMyProfile: jest.fn().mockResolvedValue(),
      getAllLecturers: jest.fn().mockResolvedValue(),
      getLecturerProfile: jest.fn(),
      assignStudent: jest.fn(),
      getAssignedStudents: jest.fn(),
    },
  };
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LecturersService,
        {
          provide: PrismaService,
          useValue: mockLecturersRepository,
        },
      ],
    }).compile();
    service = module.get<LecturersService>(LecturersService);
  });
  describe('getMyProfile', () => {
    it('should get profile', async () => {
      expect(await service.getMyProfile({}));
    });
  });
});

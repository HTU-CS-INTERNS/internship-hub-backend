import { Test } from '@nestjs/testing';
import { LecturersController } from './lecturers.controller';
import { LecturersService } from './lecturers.service';

describe('LecturersController', () => {
  let controller: LecturersController;
  const mockLecturersService = {};
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LecturersController],
      providers: [LecturersService],
    })
      .overrideProvider(LecturersService)
      .useValue(mockLecturersService)
      .compile();
    controller = moduleRef.get<LecturersController>(LecturersController);
  });
  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });
  it('should get my profile', async () => {
    expect(await controller.getMyProfile());
  });
});

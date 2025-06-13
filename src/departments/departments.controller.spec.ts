import { Test } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  const mockDepartmentsService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: 1, name: 'HR' }),
    create: jest.fn().mockResolvedValue({ id: 1, name: 'HR' }),
    update: jest.fn().mockResolvedValue({ id: 1, name: 'HR' }),
    remove: jest.fn().mockResolvedValue({ id: 1, name: 'HR' }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [DepartmentsService],
    })
      .overrideProvider(DepartmentsService)
      .useValue(mockDepartmentsService)
      .compile();

    controller = moduleRef.get<DepartmentsController>(DepartmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  it('should update a department', async () => {
    return expect(await controller.update('1', { name: 'HR' })).toEqual({
      id: 1,
      name: 'HR',
    });
  });
});

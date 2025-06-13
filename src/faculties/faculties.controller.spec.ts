import { Test } from '@nestjs/testing';
import { FacultiesController } from './faculties.controller';
import { FacultiesService } from './faculties.service';

describe('FacultiesController', () => {
  let controller: FacultiesController;

  const mockFacultiesService = {
    create: jest
      .fn()
      .mockResolvedValue({ name: 'Faculty of Applied Sciences' }),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest
      .fn()
      .mockResolvedValue({ id: 1, name: 'Faculty of Applied Sciences' }),
    update: jest.fn().mockResolvedValue({ id: 1, name: 'Updated Faculty' }),
    remove: jest.fn().mockResolvedValue({ id: 1 }),
  };
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FacultiesController],
      providers: [FacultiesService],
    })
      .overrideProvider(FacultiesService)
      .useValue(mockFacultiesService)
      .compile();

    controller = moduleRef.get<FacultiesController>(FacultiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  it('should create a faculty', async () => {
    expect(await controller.create({ name: 'Test Faculty' })).toEqual({
      name: 'Faculty of Applied Sciences',
    });
  });
  it('should return an array of faculties', async () => {
    expect(await controller.findAll()).toEqual([]);
  });
  it('should return a single faculty by id', async () => {
    expect(await controller.findOne(1)).toEqual({
      id: 1,
      name: 'Faculty of Applied Sciences',
    });
  });
  it('should update a faculty', async () => {
    expect(await controller.update(1, { name: 'Updated Faculty' })).toEqual({
      id: 1,
      name: 'Updated Faculty',
    });
  });
  it('should remove a faculty', async () => {
    expect(await controller.remove(1)).toEqual({ id: 1 });
  });
  it('should handle errors gracefully', async () => {
    mockFacultiesService.create.mockRejectedValue(new Error('Error'));
    await expect(controller.create({ name: 'Test Faculty' })).rejects.toThrow(
      'Error',
    );
  });
});

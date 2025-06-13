/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { DepartmentsService } from './departments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let prisma: PrismaService;

  const mockDepartmentsRepository = {
    departments: {
      create: jest.fn().mockResolvedValue({ id: 1, name: 'HR' }),
      findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'HR' }]),
      findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'HR' }),
      update: jest.fn().mockResolvedValue({ id: 1, name: 'HR' }),
      delete: jest.fn().mockResolvedValue({ id: 1, name: 'HR' }),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DepartmentsService,

        {
          provide: PrismaService,
          useValue: mockDepartmentsRepository,
        },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should create a department', async () => {
    expect(await service.create({ name: 'HR' } as CreateDepartmentDto)).toEqual(
      { id: 1, name: 'HR' },
    );
    expect(prisma.departments.create).toHaveBeenCalledWith({
      data: { name: 'HR' },
    });
  });
  it('should find all departments', async () => {
    expect(await service.findAll()).toEqual([{ id: 1, name: 'HR' }]);
    expect(prisma.departments.findMany).toHaveBeenCalledWith({
      where: undefined,
    });
  });
  it('should find a department by id', async () => {
    expect(await service.findOne(1)).toEqual({ id: 1, name: 'HR' });
    expect(prisma.departments.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
  it('should update a department', async () => {
    expect(await service.update(1, { name: 'Finance' })).toEqual({
      id: 1,
      name: 'HR',
    });
    expect(prisma.departments.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Finance' },
    });
  });
  it('should delete a department', async () => {
    expect(await service.remove(1)).toEqual({ id: 1, name: 'HR' });
    expect(prisma.departments.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});

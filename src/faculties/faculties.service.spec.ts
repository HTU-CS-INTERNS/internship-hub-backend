/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { FacultiesService } from './faculties.service';
import { CreateFacultyDto } from '../faculties/dto/create-faculty.dto';

describe('FacultiesService', () => {
  let service: FacultiesService;
  let prisma: PrismaService;

  const mockFacultiesRepository = {
    faculties: {
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
        FacultiesService,

        {
          provide: PrismaService,
          useValue: mockFacultiesRepository,
        },
      ],
    }).compile();

    service = module.get<FacultiesService>(FacultiesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should create a faculty', async () => {
    expect(await service.create({ name: 'HR' } as CreateFacultyDto)).toEqual({
      id: 1,
      name: 'HR',
    });
    expect(prisma.faculties.create).toHaveBeenCalledWith({
      data: { name: 'HR' },
    });
  });
  it('should find all faculties', async () => {
    expect(await service.findAll()).toEqual([{ id: 1, name: 'HR' }]);
    expect(prisma.faculties.findMany).toHaveBeenCalledWith();
  });
  it('should find a faculty by id', async () => {
    expect(await service.findOne(1)).toEqual({ id: 1, name: 'HR' });
    expect(prisma.faculties.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
  it('should update a faculty', async () => {
    expect(await service.update(1, { name: 'Finance' })).toEqual({
      id: 1,
      name: 'HR',
    });
    expect(prisma.faculties.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Finance' },
    });
  });
  it('should delete a faculty', async () => {
    expect(await service.remove(1)).toEqual({ id: 1, name: 'HR' });
    expect(prisma.faculties.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});

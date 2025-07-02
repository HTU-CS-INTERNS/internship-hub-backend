import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import * as request from 'supertest';
import { FacultiesModule } from '../src/faculties/faculties.module';
import { FacultiesService } from '../src/faculties/faculties.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/jwt.auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { JwtStrategy } from '../src/auth/jwt.strategy'; // Adjust path if needed

// ✅ Mock Guards: Always allow access
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}

class MockRolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}

// ✅ Mock Service
const mockFacultiesService = {
  findAll: jest
    .fn()
    .mockResolvedValue([
      { id: 1, name: 'Faculty of Applied Sciences and Technology' },
    ]),
  findOne: jest.fn().mockResolvedValue({
    id: 1,
    name: 'Faculty of Applied Sciences and Technology',
  }),
  create: jest.fn().mockResolvedValue({
    id: 2,
    name: 'Faculty of Engineering',
  }),
  update: jest.fn().mockResolvedValue({
    id: 1,
    name: 'Updated Faculty Name',
  }),
  remove: jest.fn().mockResolvedValue({ message: 'Faculty deleted' }),
};

// Optional mock PrismaService to avoid real DB connection
const mockPrismaService = {
  faculty: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

describe('FacultiesController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FacultiesModule],
    })
      .overrideProvider(JwtStrategy)
      .useValue({ validate: jest.fn() })
      .overrideProvider(FacultiesService)
      .useValue(mockFacultiesService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(JwtAuthGuard)
      .useClass(MockAuthGuard)
      .overrideProvider(RolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('/api/faculties (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/faculties')
      .expect(200);

    expect(response.body).toEqual([
      { id: 1, name: 'Faculty of Applied Sciences and Technology' },
    ]);
    expect(mockFacultiesService.findAll).toHaveBeenCalled();
  });

  it('/api/faculties/:id (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/faculties/1')
      .expect(200);

    expect(response.body).toEqual({
      id: 1,
      name: 'Faculty of Applied Sciences and Technology',
    });
    expect(mockFacultiesService.findOne).toHaveBeenCalledWith(1);
  });

  it('/api/faculties (POST)', async () => {
    const newFaculty = { name: 'Faculty of Engineering' };
    const response = await request(app.getHttpServer())
      .post('/api/faculties')
      .send(newFaculty)
      .expect(201);

    expect(response.body).toEqual({ id: 2, name: 'Faculty of Engineering' });
    expect(mockFacultiesService.create).toHaveBeenCalledWith(newFaculty);
  });

  it('/api/faculties/:id (PUT)', async () => {
    const updateDto = { name: 'Updated Faculty Name' };
    const response = await request(app.getHttpServer())
      .put('/api/faculties/1')
      .send(updateDto)
      .expect(200);

    expect(response.body).toEqual({ id: 1, name: 'Updated Faculty Name' });
    expect(mockFacultiesService.update).toHaveBeenCalledWith(1, updateDto);
  });

  it('/api/faculties/:id (DELETE)', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/faculties/1')
      .expect(200);

    expect(response.body).toEqual({ message: 'Faculty deleted' });
    expect(mockFacultiesService.remove).toHaveBeenCalledWith(1);
  });
});

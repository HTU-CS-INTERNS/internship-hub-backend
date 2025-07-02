import { Test } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

describe('CompanyService', () => {
  let service: CompaniesService;
  let prisma: PrismaService;
  const mockProfile = {
    id: '1',
    name: 'Node Networks',
    address: 'Silicon Valley, Delaware, US',
    city: 'Delaware',
    region: 'Phoenix Arizona',
    industry: 'Software Tech',
    contact_email: 'nodenetworks@networks.org',
  };
  const mockCompanyServiceRepository = {
    companies: {
      findUnique: jest.fn().mockResolvedValue(mockProfile),
      findMany: jest.fn().mockResolvedValue([mockProfile]),
      create: jest.fn().mockResolvedValue(mockProfile),
    },
  };
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: mockCompanyServiceRepository },
      ],
    }).compile();

    service = moduleRef.get<CompaniesService>(CompaniesService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });
  describe('createCompany', () => {
    it('should create a company', async () => {
      return expect(
        await service.createCompany(mockProfile as CreateCompanyDto),
      ).toEqual({
        id: '1',
        name: 'Node Networks',
        address: 'Silicon Valley, Delaware, US',
        city: 'Delaware',
        region: 'Phoenix Arizona',
        industry: 'Software Tech',
        contact_email: 'nodenetworks@networks.org',
      });
    });
  });
  describe('get company by Id',  () => {
    it('should get company Id', async () => {
      expect(await service.getCompanyById(1)).toEqual(mockProfile);
    });
  });
});

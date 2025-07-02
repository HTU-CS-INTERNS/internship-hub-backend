import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

describe('CompaniesController', () => {
  let controller: CompaniesController;

  const mockProfile = {
    id: '1',
    name: 'Node Networks',
    address: 'Silicon Valley, Delaware, US',
    city: 'Delaware',
    region: 'Phoenix Arizona',
    industry: 'Software Tech',
    contact_email: 'nodenetworks@networks.org',
  };
  const mockCompaniesService = {
    createCompany: jest.fn().mockResolvedValue(mockProfile),
    getAllCompanies: jest.fn().mockResolvedValue(mockProfile),
    getCompanyById: jest.fn().mockResolvedValue(mockProfile),
    updateCompany: jest.fn().mockResolvedValue(mockProfile),
  };
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [CompaniesService],
    })
      .overrideProvider(CompaniesService)
      .useValue(mockCompaniesService)
      .compile();

    controller = app.get<CompaniesController>(CompaniesController);
  });

  describe('createCompany', () => {
    it('should create company profile', async () => {
      return expect(await controller.createCompany(mockProfile)).toEqual({
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
  describe('getAllCompanies', () => {
    it('should retrieve the company info', async () => {
      return expect(await controller.getAllCompanies());
    });
  });
  describe('getCompanyById', () => {
    it('should retrieve a company by id', async () => {
      return expect(await controller.getCompanyById(mockProfile.id));
    });
  });
  describe('updateCompany', () => {
    it('should update the company table', async () => {
      return expect(
        await controller.updateCompany(mockProfile.id, mockProfile),
      );
    });
  });
});

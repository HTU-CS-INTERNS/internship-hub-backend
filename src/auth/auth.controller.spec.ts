/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  const mockAuthService = {
    login: jest.fn(),
  };
  const mockUsersService = {
    validateUser: jest.fn(),
  };
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = moduleRef.get<AuthController>(AuthController);
    authService = moduleRef.get<AuthService>(AuthService);
    usersService = moduleRef.get<UsersService>(UsersService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('login', () => {
    const validLoginDto: LoginDto = {
      email: '0322080423@htu.edu.gh',
      password: 'h3ll0423',
    };
    const invalidLoginDto: LoginDto = {
      email: 'invalid-email',
      password: 'wrongpassword',
    };
    it('should return access token on successful login', async () => {
      const mockUser = {
        id: 1,
        email: 'validLoginDto.email',
        role: 'student',
      };
      jest.spyOn(usersService, 'validateUser').mockResolvedValue(mockUser);
      const mockToken = { token: 'mockAccessToken', user: mockUser };
      jest.spyOn(authService, 'login').mockResolvedValue(mockToken);
      const result = await controller.login(validLoginDto);
      expect(result).toEqual(mockToken);
      expect(usersService.validateUser).toHaveBeenCalledWith(
        validLoginDto.email,
        validLoginDto.password,
      );
      expect(authService.login).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
    it('should return invalid credentials', async () => {
      jest.spyOn(usersService, 'validateUser').mockResolvedValue(null);
      await expect(controller.login(invalidLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.validateUser).toHaveBeenCalledWith(
        invalidLoginDto.email,
        invalidLoginDto.password,
      );
      expect(authService.login).not.toHaveBeenCalled();
    });
    it('should handle validation error and throw an unauthorized exception', async () => {
      const errorMessage = 'Database connection failed';
      jest
        .spyOn(usersService, 'validateUser')
        .mockRejectedValue(new Error(errorMessage));
      await expect(controller.login(validLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(validLoginDto)).rejects.toThrow(
        errorMessage,
      );
    });
  });
});

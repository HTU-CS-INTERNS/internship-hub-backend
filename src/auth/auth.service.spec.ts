/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  const createMockUser = (overrides: Record<string, any> = {}) => ({
    id: 1,
    email: 'test@example.com',
    password: 'hashed-password',
    role: 'user',
    first_name: 'John',
    last_name: 'Doe',
    phone_number: null,
    is_active: true,
    created_at: new Date(),
    update_at: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    // Create mock implementations for dependencies
    const mockUsersService = {
      findByEmail: jest.fn(), // Changed from findOne to findByEmail
    };

    const mockJwtService = {
      signAsync: jest.fn(), // Changed from sign to signAsync
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    usersService = moduleRef.get<UsersService>(UsersService);
    jwtService = moduleRef.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Reset mocks between tests
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      // Mock user data
      const mockUser = createMockUser({ password: 'hashed-password' });

      // Mock database response
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 'user',
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const mockUser = createMockUser({ password: 'hashed-password' });
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        authService.validateUser('test@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(
        authService.validateUser('unknown@test.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user has no password', async () => {
      // Simulate OAuth user without password
      const mockUser = createMockUser({
        password: null,
      });

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      await expect(
        authService.validateUser('oauth@example.com', 'any-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return token and user object', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'admin',
      };

      const result = await authService.login(mockUser);

      expect(result).toEqual({
        // token: 'fake-token',
        user: mockUser,
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: 1,
        role: 'admin',
      });
    });
  });
});

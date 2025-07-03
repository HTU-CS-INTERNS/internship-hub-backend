import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto'; // you need to create this file
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return this.authService.login({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message);
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    try {
      const existingUser = await this.usersService.findByEmail(signupDto.email);
      if (existingUser) {
        throw new ConflictException('User already exists');
      }

      const hashedPassword = await bcrypt.hash(signupDto.password, 10);

      const newUser = await this.usersService.createUser({
        email: signupDto.email,
        password: hashedPassword,
        role: signupDto.role,
        first_name: signupDto.first_name,
        last_name: signupDto.last_name,
      });

      return this.authService.login({
        id: newUser.id,
        email: newUser.email!,
        role: newUser.role,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new UnauthorizedException(err.message);
      }
      throw new UnauthorizedException('Signup failed');
    }
  }
}

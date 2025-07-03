import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: number; email: string; role: string } | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    console.log('Incoming Password:', password);
    console.log('Stored Hash:', user.password);
    const passwordMatches: boolean = await bcrypt.compare(
      password,
      user.password,
    );
    console.log('Password Matches:', passwordMatches);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email!,
      role: user.role,
    };
  }

  async login(user: { id: number; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user,
    };
  }

  async signup(signupDto: SignupDto) {
    const existing = await this.usersService.findByEmail(signupDto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    const newUser = await this.usersService.createUser({
      ...signupDto,
      password: hashedPassword,
    });

    return {
      message: 'Signup successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type User = Prisma.usersGetPayload<true>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: {
    email?: string | null;
    password: string;
    role: string;
    first_name: string;
    last_name: string;
    phone_number?: string | null;
    is_active?: boolean | null;
  }): Promise<User> {
    return this.prisma.users.create({
      data: {
        email: data.email,
        password: data.password,
        role: data.role,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        is_active: data.is_active ?? true,
      },
    });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.prisma.users.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.users.findUnique({
      where: { email },
    });
  }

  async updateUser(
    id: number,
    data: {
      email?: string | null;
      password?: string;
      role?: string;
      first_name?: string;
      last_name?: string;
      phone_number?: string | null;
      is_active?: boolean | null;
    },
  ): Promise<User> {
    return this.prisma.users.update({
      where: { id },
      data,
    });
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: number; email: string; role: string } | null> {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordMatches: boolean = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email!,
      role: user.role,
    };
  }
}

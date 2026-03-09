import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        createdAt: true,
        profile: true,
      },
    });
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.userProfile.update({
      where: { userId },
      data,
    });
  }
}

import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdPlatform, UserRole } from '@prisma/client';

@Injectable()
export class AdAccountsService {
  constructor(private prisma: PrismaService) {}

  async getUserAdAccounts(userId: string) {
    return this.prisma.adAccount.findMany({
      where: { userId, isActive: true },
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAdAccountById(userId: string, adAccountId: string) {
    return this.prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId,
      },
      include: {
        campaigns: {
          take: 10,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });
  }

  /**
   * Check if user can add more accounts for a specific platform
   * USER role: max 1 account per platform
   * MEDIA_BUYER role: unlimited accounts
   */
  async canAddAccount(userId: string, platform: AdPlatform): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Media buyers can add unlimited accounts
    if (user.role === UserRole.MEDIA_BUYER) {
      return true;
    }

    // Normal users: check if they already have an account for this platform
    const existingCount = await this.prisma.adAccount.count({
      where: {
        userId,
        platform,
        isActive: true,
      },
    });

    return existingCount === 0;
  }

  /**
   * Validate that user can add account, throw error if not
   */
  async validateCanAddAccount(userId: string, platform: AdPlatform): Promise<void> {
    const canAdd = await this.canAddAccount(userId, platform);

    if (!canAdd) {
      throw new ForbiddenException(
        `You already have a ${platform} account connected. Upgrade to Media Buyer role to connect multiple accounts.`,
      );
    }
  }

  /**
   * Update account name (for media buyers managing multiple clients)
   */
  async updateAccountName(userId: string, adAccountId: string, newName: string) {
    const account = await this.prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId,
      },
    });

    if (!account) {
      throw new BadRequestException('Ad account not found');
    }

    return this.prisma.adAccount.update({
      where: { id: adAccountId },
      data: { accountName: newName },
    });
  }

  /**
   * Delete/disconnect ad account
   */
  async deleteAdAccount(userId: string, adAccountId: string) {
    const account = await this.prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId,
      },
    });

    if (!account) {
      throw new BadRequestException('Ad account not found');
    }

    // Soft delete: mark as inactive and disconnected
    await this.prisma.adAccount.update({
      where: { id: adAccountId },
      data: {
        isActive: false,
        isConnected: false,
      },
    });

    // Check if user has any remaining active accounts
    const remainingCount = await this.prisma.adAccount.count({
      where: { userId, isActive: true },
    });

    // If no accounts left, reset the onboarding flag
    if (remainingCount === 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { hasConnectedAdAccount: false },
      });
    }
  }

  /**
   * Mark user as having connected their first ad account
   */
  async markUserAsOnboarded(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hasConnectedAdAccount: true },
    });
  }
}

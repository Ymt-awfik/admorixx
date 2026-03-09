import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async getUserCampaigns(userId: string) {
    return this.prisma.campaign.findMany({
      where: {
        adAccount: { userId },
      },
      include: {
        adAccount: {
          select: {
            accountName: true,
            platform: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getCampaignById(userId: string, campaignId: string) {
    return this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        adAccount: { userId },
      },
      include: {
        adAccount: true,
        ads: true,
        metricsDaily: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });
  }
}

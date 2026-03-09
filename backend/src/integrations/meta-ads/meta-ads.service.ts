import { Injectable, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { UserRole, AdPlatform } from '@prisma/client';
import axios from 'axios';

export interface MetaAdAccount {
  id: string;
  name: string;
  account_id: string;
  currency: string;
  timezone_name: string;
}

@Injectable()
export class MetaAdsService {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly accessToken: string;
  private readonly redirectUri: string;
  private readonly graphApiVersion = 'v18.0';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
  ) {
    this.appId = this.configService.get<string>('META_APP_ID');
    this.appSecret = this.configService.get<string>('META_APP_SECRET');
    this.accessToken = this.configService.get<string>('META_ACCESS_TOKEN');
    this.redirectUri = this.configService.get<string>('META_REDIRECT_URI');
  }

  /**
   * Get Meta OAuth authorization URL
   */
  getAuthorizationUrl(userId: string): string {
    if (!this.appId) {
      throw new BadRequestException(
        'Meta App credentials are not configured. Please use manual connect or contact your administrator.',
      );
    }

    const scopes = [
      'ads_management',
      'ads_read',
      'business_management',
    ];

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state: userId,
    });

    return `https://www.facebook.com/${this.graphApiVersion}/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async handleOAuthCallback(code: string, userId: string): Promise<string> {
    try {
      const tokenUrl = `https://graph.facebook.com/${this.graphApiVersion}/oauth/access_token`;
      const params = {
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: this.redirectUri,
        code,
      };

      const response = await axios.get(tokenUrl, { params });
      const accessToken = response.data.access_token;

      // Exchange for long-lived token (60 days)
      const longLivedToken = await this.exchangeForLongLivedToken(accessToken);

      return longLivedToken;
    } catch (error) {
      console.error('Meta OAuth callback error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to exchange authorization code for Meta access token');
    }
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  private async exchangeForLongLivedToken(shortLivedToken: string): Promise<string> {
    try {
      const url = `https://graph.facebook.com/${this.graphApiVersion}/oauth/access_token`;
      const params = {
        grant_type: 'fb_exchange_token',
        client_id: this.appId,
        client_secret: this.appSecret,
        fb_exchange_token: shortLivedToken,
      };

      const response = await axios.get(url, { params });
      return response.data.access_token;
    } catch (error) {
      console.error('Failed to exchange for long-lived token:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to get long-lived access token');
    }
  }

  /**
   * Get user's Meta Ad Accounts
   */
  async getAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
    try {
      const url = `https://graph.facebook.com/${this.graphApiVersion}/me/adaccounts`;
      const params = {
        access_token: accessToken,
        fields: 'id,name,account_id,currency,timezone_name,account_status',
      };

      const response = await axios.get(url, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch Meta ad accounts:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to fetch Meta ad accounts');
    }
  }

  /**
   * Connect a Meta Ad Account
   */
  async connectAdAccount(
    userId: string,
    adAccountId: string,
    accessToken: string,
  ): Promise<any> {
    try {
      // Validate role limits before connecting
      await this.validateUserCanAddAccount(userId, AdPlatform.FACEBOOK_ADS);

      // Get ad account details
      const url = `https://graph.facebook.com/${this.graphApiVersion}/${adAccountId}`;
      const params = {
        access_token: accessToken,
        fields: 'id,name,account_id,currency,timezone_name',
      };

      const response = await axios.get(url, { params });
      const accountData = response.data;

      // Encrypt access token before storing
      const encryptedAccessToken = this.encryptionService.encrypt(accessToken);

      // Store ad account in database
      const adAccount = await this.prisma.adAccount.create({
        data: {
          userId,
          platform: 'FACEBOOK_ADS',
          platformAccountId: accountData.account_id,
          accountName: accountData.name,
          currency: accountData.currency || 'USD',
          timezone: accountData.timezone_name || 'UTC',
          accessToken: encryptedAccessToken,
          refreshToken: null, // Meta uses long-lived tokens, not refresh tokens
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          isActive: true,
          isConnected: true,
          syncStatus: 'pending',
        },
      });

      // Mark user as onboarded (has connected first ad account)
      await this.prisma.user.update({
        where: { id: userId },
        data: { hasConnectedAdAccount: true },
      });

      return adAccount;
    } catch (error) {
      console.error('Failed to connect Meta ad account:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to connect Meta ad account');
    }
  }

  /**
   * Validate that user can add account for this platform based on role
   */
  private async validateUserCanAddAccount(userId: string, platform: AdPlatform): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Media buyers can add unlimited accounts
    if (user.role === UserRole.MEDIA_BUYER) {
      return;
    }

    // Normal users: check if they already have an account for this platform
    const existingCount = await this.prisma.adAccount.count({
      where: {
        userId,
        platform,
        isActive: true,
      },
    });

    if (existingCount > 0) {
      throw new ForbiddenException(
        `You already have a ${platform} account connected. Upgrade to Media Buyer role to connect multiple accounts.`,
      );
    }
  }

  /**
   * Sync campaigns from Meta Ads
   */
  async syncCampaigns(adAccountId: string): Promise<number> {
    const adAccount = await this.prisma.adAccount.findUnique({
      where: { id: adAccountId },
    });

    if (!adAccount) {
      throw new BadRequestException('Ad account not found');
    }

    // Decrypt access token
    const accessToken = this.encryptionService.decrypt(adAccount.accessToken);

    try {
      const url = `https://graph.facebook.com/${this.graphApiVersion}/act_${adAccount.platformAccountId}/campaigns`;
      const params = {
        access_token: accessToken,
        fields: 'id,name,status,daily_budget,lifetime_budget,objective',
      };

      const response = await axios.get(url, { params });
      const campaigns = response.data.data || [];

      // Update sync status
      await this.prisma.adAccount.update({
        where: { id: adAccountId },
        data: { syncStatus: 'syncing' },
      });

      let syncedCount = 0;

      for (const campaign of campaigns) {
        const campaignStatus = this.mapCampaignStatus(campaign.status);

        await this.prisma.campaign.upsert({
          where: {
            adAccountId_platformCampaignId: {
              adAccountId: adAccount.id,
              platformCampaignId: campaign.id,
            },
          },
          create: {
            adAccountId: adAccount.id,
            platformCampaignId: campaign.id,
            name: campaign.name || 'Unknown Campaign',
            status: campaignStatus,
            budgetAmount: campaign.daily_budget
              ? parseFloat(campaign.daily_budget) / 100
              : campaign.lifetime_budget
              ? parseFloat(campaign.lifetime_budget) / 100
              : null,
            budgetType: campaign.daily_budget ? 'daily' : 'lifetime',
          },
          update: {
            name: campaign.name || 'Unknown Campaign',
            status: campaignStatus,
            budgetAmount: campaign.daily_budget
              ? parseFloat(campaign.daily_budget) / 100
              : campaign.lifetime_budget
              ? parseFloat(campaign.lifetime_budget) / 100
              : null,
            budgetType: campaign.daily_budget ? 'daily' : 'lifetime',
          },
        });

        syncedCount++;
      }

      // Update sync status
      await this.prisma.adAccount.update({
        where: { id: adAccountId },
        data: {
          syncStatus: 'success',
          lastSyncAt: new Date(),
          syncError: null,
        },
      });

      return syncedCount;
    } catch (error) {
      // Update sync status with error
      await this.prisma.adAccount.update({
        where: { id: adAccountId },
        data: {
          syncStatus: 'error',
          syncError: error.message,
        },
      });

      throw new InternalServerErrorException(
        `Failed to sync campaigns: ${error.message}`,
      );
    }
  }

  /**
   * Map Meta campaign status to our enum
   */
  private mapCampaignStatus(status: string): 'ENABLED' | 'PAUSED' | 'REMOVED' | 'UNKNOWN' {
    switch (status) {
      case 'ACTIVE':
        return 'ENABLED';
      case 'PAUSED':
        return 'PAUSED';
      case 'DELETED':
      case 'ARCHIVED':
        return 'REMOVED';
      default:
        return 'UNKNOWN';
    }
  }
}

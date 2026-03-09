import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import axios from 'axios';

@Injectable()
export class TikTokAdsService {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
  ) {
    this.appId = this.configService.get<string>('TIKTOK_APP_ID') || '';
    this.appSecret = this.configService.get<string>('TIKTOK_APP_SECRET') || '';
    this.redirectUri = this.configService.get<string>('TIKTOK_REDIRECT_URI') || '';
  }

  /**
   * Generate TikTok OAuth authorization URL
   */
  getAuthorizationUrl(userId: string): string {
    if (!this.appId) {
      throw new BadRequestException(
        'TikTok App credentials are not configured. Please use manual connect or contact your administrator.',
      );
    }

    const baseUrl = 'https://business-api.tiktok.com/portal/auth';
    const params = new URLSearchParams({
      app_id: this.appId,
      redirect_uri: this.redirectUri,
      state: userId,
    });
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange auth code for access token
   */
  async handleOAuthCallback(authCode: string): Promise<{ accessToken: string; advertiserId: string }> {
    try {
      const response = await axios.post('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
        app_id: this.appId,
        secret: this.appSecret,
        auth_code: authCode,
      });

      if (response.data.code !== 0) {
        throw new BadRequestException(response.data.message || 'Failed to get TikTok access token');
      }

      return {
        accessToken: response.data.data.access_token,
        advertiserId: response.data.data.advertiser_ids?.[0] || '',
      };
    } catch (error) {
      throw new BadRequestException('Failed to exchange TikTok authorization code');
    }
  }

  /**
   * Get advertiser accounts using access token
   */
  async getAdvertiserAccounts(accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get('https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/', {
        headers: {
          'Access-Token': accessToken,
        },
        params: {
          app_id: this.appId,
          secret: this.appSecret,
        },
      });

      if (response.data.code !== 0) {
        throw new BadRequestException(response.data.message || 'Failed to get advertiser accounts');
      }

      return response.data.data?.list || [];
    } catch (error) {
      throw new BadRequestException('Failed to fetch TikTok advertiser accounts');
    }
  }

  /**
   * Connect a TikTok Ads account
   */
  async connectAdAccount(
    userId: string,
    advertiserId: string,
    accessToken: string,
    accountName?: string,
  ): Promise<any> {
    const encryptedToken = this.encryptionService.encrypt(accessToken);

    const adAccount = await this.prisma.adAccount.create({
      data: {
        userId,
        platform: 'TIKTOK_ADS',
        platformAccountId: advertiserId,
        accountName: accountName || `TikTok Ads ${advertiserId}`,
        currency: 'USD',
        timezone: 'UTC',
        accessToken: encryptedToken,
        isActive: true,
        isConnected: true,
        syncStatus: 'pending',
      },
    });

    // Mark user as onboarded
    await this.prisma.user.update({
      where: { id: userId },
      data: { hasConnectedAdAccount: true },
    });

    return adAccount;
  }
}

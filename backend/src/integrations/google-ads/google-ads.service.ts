import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAdsApi, Customer, enums } from 'google-ads-api';
import { google } from 'googleapis';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';

interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

interface CampaignData {
  id: string;
  name: string;
  status: string;
  budgetAmount?: number;
  budgetType?: string;
}

interface MetricData {
  date: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
}

@Injectable()
export class GoogleAdsService {
  private oauth2Client: any;
  private developerToken: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
  ) {
    this.developerToken = this.configService.get<string>('GOOGLE_ADS_DEVELOPER_TOKEN');

    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(userId: string, customerId?: string): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException(
        'Google OAuth credentials are not configured. Please use manual connect or contact your administrator.',
      );
    }

    const scopes = [
      'https://www.googleapis.com/auth/adwords',
    ];

    // Encode customerId in state so the callback can use it
    const state = customerId ? `${userId}|${customerId}` : userId;

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state,
    });

    return authUrl;
  }

  /**
   * List accessible Google Ads customer IDs using the authenticated token
   */
  async listAccessibleCustomers(accessToken: string): Promise<string[]> {
    try {
      if (!this.developerToken) {
        return [];
      }
      const response = await axios.get(
        'https://googleads.googleapis.com/v17/customers:listAccessibleCustomers',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.developerToken,
          },
        },
      );
      // Response: { resourceNames: ["customers/1234567890", ...] }
      return (response.data.resourceNames || []).map((name: string) =>
        name.replace('customers/', ''),
      );
    } catch (error) {
      console.error('Failed to list accessible customers:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleOAuthCallback(
    code: string,
    userId: string,
  ): Promise<OAuthTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      };
    } catch (error) {
      throw new BadRequestException('Failed to exchange authorization code');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      const decryptedRefreshToken = this.encryptionService.decrypt(refreshToken);

      this.oauth2Client.setCredentials({
        refresh_token: decryptedRefreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      return {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        expiry_date: credentials.expiry_date,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to refresh access token');
    }
  }

  /**
   * Connect a Google Ads account
   */
  async connectAdAccount(
    userId: string,
    customerId: string,
    tokens: OAuthTokens,
  ): Promise<any> {
    // Encrypt tokens before storing
    const encryptedAccessToken = this.encryptionService.encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? this.encryptionService.encrypt(tokens.refresh_token)
      : null;

    // Get account details from Google Ads API
    const accountInfo = await this.getAccountInfo(customerId, tokens.access_token);

    // Store ad account in database
    const adAccount = await this.prisma.adAccount.create({
      data: {
        userId,
        platform: 'GOOGLE_ADS',
        platformAccountId: customerId,
        accountName: accountInfo.name,
        currency: accountInfo.currency || 'USD',
        timezone: accountInfo.timezone || 'UTC',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
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
  }

  /**
   * Get account information from Google Ads API
   */
  private async getAccountInfo(
    customerId: string,
    accessToken: string,
  ): Promise<{ name: string; currency: string; timezone: string }> {
    try {
      const client = this.createGoogleAdsClient(customerId, accessToken);

      const query = `
        SELECT
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone
        FROM customer
        WHERE customer.id = ${customerId}
      `;

      const [response] = await client.query(query);

      return {
        name: response.customer?.descriptive_name || 'Unknown Account',
        currency: response.customer?.currency_code || 'USD',
        timezone: response.customer?.time_zone || 'UTC',
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      return {
        name: `Google Ads Account ${customerId}`,
        currency: 'USD',
        timezone: 'UTC',
      };
    }
  }

  /**
   * Create Google Ads API client
   */
  private createGoogleAdsClient(customerId: string, accessToken: string): Customer {
    const client = new GoogleAdsApi({
      client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      developer_token: this.developerToken,
    });

    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: accessToken, // Will use access token directly
    });

    return customer;
  }

  /**
   * Sync campaigns from Google Ads
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

    // Check if token needs refresh
    if (adAccount.tokenExpiresAt && adAccount.tokenExpiresAt < new Date()) {
      const refreshedTokens = await this.refreshAccessToken(adAccount.refreshToken);
      // Update tokens in database
      await this.prisma.adAccount.update({
        where: { id: adAccountId },
        data: {
          accessToken: this.encryptionService.encrypt(refreshedTokens.access_token),
          tokenExpiresAt: refreshedTokens.expiry_date
            ? new Date(refreshedTokens.expiry_date)
            : null,
        },
      });
    }

    const client = this.createGoogleAdsClient(
      adAccount.platformAccountId,
      accessToken,
    );

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.amount_micros,
        campaign_budget.period
      FROM campaign
    `;

    try {
      const campaigns = await client.query(query);

      // Update sync status
      await this.prisma.adAccount.update({
        where: { id: adAccountId },
        data: { syncStatus: 'syncing' },
      });

      let syncedCount = 0;

      for (const row of campaigns) {
        const campaignStatus = this.mapCampaignStatus(row.campaign?.status);

        await this.prisma.campaign.upsert({
          where: {
            adAccountId_platformCampaignId: {
              adAccountId: adAccount.id,
              platformCampaignId: row.campaign?.id?.toString(),
            },
          },
          create: {
            adAccountId: adAccount.id,
            platformCampaignId: row.campaign?.id?.toString(),
            name: row.campaign?.name || 'Unknown Campaign',
            status: campaignStatus,
            budgetAmount: row.campaign_budget?.amount_micros
              ? row.campaign_budget.amount_micros / 1_000_000
              : null,
            budgetType: row.campaign_budget?.period ? String(row.campaign_budget.period) : null,
          },
          update: {
            name: row.campaign?.name || 'Unknown Campaign',
            status: campaignStatus,
            budgetAmount: row.campaign_budget?.amount_micros
              ? row.campaign_budget.amount_micros / 1_000_000
              : null,
            budgetType: row.campaign_budget?.period ? String(row.campaign_budget.period) : null,
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
   * Sync metrics from Google Ads
   */
  async syncMetrics(
    adAccountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const adAccount = await this.prisma.adAccount.findUnique({
      where: { id: adAccountId },
      include: { campaigns: true },
    });

    if (!adAccount) {
      throw new BadRequestException('Ad account not found');
    }

    const accessToken = this.encryptionService.decrypt(adAccount.accessToken);
    const client = this.createGoogleAdsClient(
      adAccount.platformAccountId,
      accessToken,
    );

    const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
    const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');

    const query = `
      SELECT
        campaign.id,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date BETWEEN '${startDateStr}' AND '${endDateStr}'
    `;

    try {
      const metrics = await client.query(query);

      let syncedCount = 0;

      for (const row of metrics) {
        const campaign = adAccount.campaigns.find(
          (c) => c.platformCampaignId === row.campaign?.id?.toString(),
        );

        if (!campaign) continue;

        const date = this.parseGoogleAdsDate(row.segments?.date);
        const cost = row.metrics?.cost_micros ? row.metrics.cost_micros / 1_000_000 : 0;
        const clicks = row.metrics?.clicks || 0;
        const impressions = row.metrics?.impressions || 0;
        const conversions = row.metrics?.conversions || 0;

        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cpc = clicks > 0 ? cost / clicks : 0;
        const cpa = conversions > 0 ? cost / conversions : 0;

        await this.prisma.metricDaily.upsert({
          where: {
            adAccountId_level_date_campaignId_adId: {
              adAccountId: adAccount.id,
              level: 'CAMPAIGN',
              date,
              campaignId: campaign.id,
              adId: null,
            },
          },
          create: {
            adAccountId: adAccount.id,
            level: 'CAMPAIGN',
            campaignId: campaign.id,
            date,
            impressions,
            clicks,
            conversions,
            spend: cost,
            revenue: 0, // Will be populated from external source
            ctr,
            cpc,
            cpa,
            roas: 0,
            currency: adAccount.currency,
          },
          update: {
            impressions,
            clicks,
            conversions,
            spend: cost,
            ctr,
            cpc,
            cpa,
          },
        });

        syncedCount++;
      }

      return syncedCount;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to sync metrics: ${error.message}`,
      );
    }
  }

  /**
   * Map Google Ads campaign status to our enum
   */
  private mapCampaignStatus(status: any): 'ENABLED' | 'PAUSED' | 'REMOVED' | 'UNKNOWN' {
    // Google Ads status enum: 0=UNKNOWN, 2=ENABLED, 3=PAUSED, 4=REMOVED
    const statusNum = typeof status === 'number' ? status : Number(status);
    switch (statusNum) {
      case 2:
        return 'ENABLED';
      case 3:
        return 'PAUSED';
      case 4:
        return 'REMOVED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Parse Google Ads date format (YYYYMMDD)
   */
  private parseGoogleAdsDate(dateStr: string): Date {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }
}

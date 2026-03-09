import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GoogleAdsService } from './google-ads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { AllowWithoutAdAccount } from '../../common/decorators/allow-without-ad-account.decorator';

@ApiTags('Google Ads')
@Controller('integrations/google-ads')
export class GoogleAdsController {
  constructor(private googleAdsService: GoogleAdsService) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @AllowWithoutAdAccount()
  @ApiOperation({ summary: 'Get Google OAuth authorization URL' })
  getAuthUrl(
    @CurrentUser() user: CurrentUserData,
    @Query('customerId') customerId?: string,
  ) {
    const authUrl = this.googleAdsService.getAuthorizationUrl(user.userId, customerId);
    return { authUrl };
  }

  @Get('callback')
  @AllowWithoutAdAccount()
  @ApiOperation({ summary: 'Handle OAuth redirect callback from Google' })
  async handleOAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    if (error) {
      return res.redirect(
        `${frontendUrl}/connect-ad-accounts?google_error=${encodeURIComponent(error)}`,
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${frontendUrl}/connect-ad-accounts?google_error=${encodeURIComponent('Invalid callback parameters')}`,
      );
    }

    try {
      // State format: "userId" or "userId|customerId"
      const parts = state.split('|');
      const userId = parts[0];
      const customerId = parts[1] || null;

      const tokens = await this.googleAdsService.handleOAuthCallback(code, userId);

      // Use provided customerId or try auto-discover
      let targetCustomerId = customerId;
      if (!targetCustomerId) {
        const customers = await this.googleAdsService.listAccessibleCustomers(tokens.access_token);
        if (customers.length > 0) {
          targetCustomerId = customers[0];
        }
      }

      if (!targetCustomerId) {
        return res.redirect(
          `${frontendUrl}/connect-ad-accounts?google_error=${encodeURIComponent('Could not detect your Google Ads Customer ID. Please enter it and try again, or use manual connect.')}`,
        );
      }

      await this.googleAdsService.connectAdAccount(userId, targetCustomerId, tokens);

      return res.redirect(
        `${frontendUrl}/connect-ad-accounts?google_success=true&message=${encodeURIComponent('Google Ads account connected successfully!')}`,
      );
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      return res.redirect(
        `${frontendUrl}/connect-ad-accounts?google_error=${encodeURIComponent('Failed to connect Google Ads account')}`,
      );
    }
  }

  @Post('callback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Handle OAuth callback (legacy POST)' })
  async handleCallbackPost(
    @CurrentUser() user: CurrentUserData,
    @Body('code') code: string,
    @Body('customerId') customerId: string,
  ) {
    if (!code || !customerId) {
      throw new BadRequestException('Authorization code and customer ID are required');
    }

    const tokens = await this.googleAdsService.handleOAuthCallback(code, user.userId);
    const adAccount = await this.googleAdsService.connectAdAccount(
      user.userId,
      customerId,
      tokens,
    );

    return {
      message: 'Account connected successfully',
      adAccount: {
        id: adAccount.id,
        accountName: adAccount.accountName,
        platformAccountId: adAccount.platformAccountId,
      },
    };
  }

  @Post('manual-connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @AllowWithoutAdAccount()
  @ApiOperation({ summary: 'Manually connect using existing credentials' })
  async manualConnect(
    @CurrentUser() user: CurrentUserData,
    @Body('accessToken') accessToken: string,
    @Body('refreshToken') refreshToken: string,
    @Body('customerId') customerId: string,
  ) {
    if (!accessToken || !customerId) {
      throw new BadRequestException('Access token and customer ID are required');
    }

    const adAccount = await this.googleAdsService.connectAdAccount(
      user.userId,
      customerId,
      {
        access_token: accessToken,
        refresh_token: refreshToken || undefined,
      },
    );

    return {
      message: 'Google Ads account connected successfully',
      adAccount: {
        id: adAccount.id,
        accountName: adAccount.accountName,
        platformAccountId: adAccount.platformAccountId,
      },
    };
  }

  @Post('sync-campaigns')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync campaigns from Google Ads' })
  async syncCampaigns(
    @CurrentUser() user: CurrentUserData,
    @Body('adAccountId') adAccountId: string,
  ) {
    if (!adAccountId) {
      throw new BadRequestException('Ad account ID is required');
    }

    const count = await this.googleAdsService.syncCampaigns(adAccountId);

    return {
      message: `Successfully synced ${count} campaigns`,
      count,
    };
  }

  @Post('sync-metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync metrics from Google Ads' })
  async syncMetrics(
    @CurrentUser() user: CurrentUserData,
    @Body('adAccountId') adAccountId: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
  ) {
    if (!adAccountId) {
      throw new BadRequestException('Ad account ID is required');
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const count = await this.googleAdsService.syncMetrics(adAccountId, start, end);

    return {
      message: `Successfully synced ${count} metric records`,
      count,
    };
  }
}

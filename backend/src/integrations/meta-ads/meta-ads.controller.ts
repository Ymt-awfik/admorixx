import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MetaAdsService } from './meta-ads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { AllowWithoutAdAccount } from '../../common/decorators/allow-without-ad-account.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Meta Ads')
@Controller('integrations/meta-ads')
export class MetaAdsController {
  constructor(private metaAdsService: MetaAdsService) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @AllowWithoutAdAccount()
  @ApiOperation({ summary: 'Get Meta OAuth authorization URL' })
  getAuthUrl(@CurrentUser() user: CurrentUserData) {
    const authUrl = this.metaAdsService.getAuthorizationUrl(user.userId);
    return { authUrl };
  }

  @Get('callback')
  @Public()
  @AllowWithoutAdAccount()
  @ApiOperation({ summary: 'Handle OAuth callback from Meta' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    // Handle OAuth error
    if (error) {
      return res.redirect(
        `${frontendUrl}/connect-ad-accounts?meta_error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code || !userId) {
      return res.redirect(
        `${frontendUrl}/connect-ad-accounts?meta_error=${encodeURIComponent('Invalid callback parameters')}`
      );
    }

    try {
      // Exchange code for access token
      const accessToken = await this.metaAdsService.handleOAuthCallback(code, userId);

      // Get available ad accounts
      const adAccounts = await this.metaAdsService.getAdAccounts(accessToken);

      // If only one ad account, connect it automatically
      if (adAccounts.length === 1) {
        await this.metaAdsService.connectAdAccount(
          userId,
          adAccounts[0].id,
          accessToken,
        );
        return res.redirect(
          `${frontendUrl}/connect-ad-accounts?meta_success=true&message=${encodeURIComponent('Meta Ads account connected successfully')}`
        );
      }

      // Multiple accounts - redirect to frontend to let user choose
      // Store access token temporarily (you might want to use a proper session store)
      return res.redirect(
        `${frontendUrl}/connect-ad-accounts?meta_success=true&message=${encodeURIComponent('Please select an ad account to connect')}&accounts=${encodeURIComponent(JSON.stringify(adAccounts))}&token=${accessToken}`
      );
    } catch (error) {
      console.error('Meta OAuth callback error:', error);
      return res.redirect(
        `${frontendUrl}/connect-ad-accounts?meta_error=${encodeURIComponent('Failed to connect Meta Ads account')}`
      );
    }
  }

  @Post('manual-connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @AllowWithoutAdAccount()
  @ApiOperation({ summary: 'Manually connect using existing access token (dev only)' })
  async manualConnect(
    @CurrentUser() user: CurrentUserData,
    @Body('accessToken') accessToken: string,
  ) {
    if (!accessToken) {
      throw new BadRequestException('Access token is required');
    }

    try {
      // Get available ad accounts
      const adAccounts = await this.metaAdsService.getAdAccounts(accessToken);

      if (adAccounts.length === 0) {
        throw new BadRequestException('No ad accounts found for this token');
      }

      // Connect the first account automatically
      const firstAccount = adAccounts[0];
      const connectedAccount = await this.metaAdsService.connectAdAccount(
        user.userId,
        firstAccount.id,
        accessToken,
      );

      return {
        message: 'Account connected successfully',
        adAccount: {
          id: connectedAccount.id,
          accountName: connectedAccount.accountName,
          platformAccountId: connectedAccount.platformAccountId,
        },
        availableAccounts: adAccounts,
      };
    } catch (error) {
      console.error('Manual connect error:', error);
      throw new BadRequestException(error.message || 'Failed to connect account');
    }
  }

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @AllowWithoutAdAccount()
  @ApiOperation({ summary: 'Connect a specific Meta ad account' })
  async connectAccount(
    @CurrentUser() user: CurrentUserData,
    @Body('adAccountId') adAccountId: string,
    @Body('accessToken') accessToken: string,
  ) {
    if (!adAccountId || !accessToken) {
      throw new BadRequestException('Ad account ID and access token are required');
    }

    const adAccount = await this.metaAdsService.connectAdAccount(
      user.userId,
      adAccountId,
      accessToken,
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

  @Post('sync-campaigns')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync campaigns from Meta Ads' })
  async syncCampaigns(
    @CurrentUser() user: CurrentUserData,
    @Body('adAccountId') adAccountId: string,
  ) {
    if (!adAccountId) {
      throw new BadRequestException('Ad account ID is required');
    }

    const count = await this.metaAdsService.syncCampaigns(adAccountId);

    return {
      message: `Successfully synced ${count} campaigns`,
      campaignCount: count,
    };
  }
}

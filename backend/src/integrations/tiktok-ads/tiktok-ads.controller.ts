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
import { TikTokAdsService } from './tiktok-ads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { AllowWithoutAdAccount } from '../../common/decorators/allow-without-ad-account.decorator';

@ApiTags('TikTok Ads')
@Controller('integrations/tiktok-ads')
export class TikTokAdsController {
  constructor(private tiktokAdsService: TikTokAdsService) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @AllowWithoutAdAccount()
  @ApiOperation({ summary: 'Get TikTok OAuth authorization URL' })
  getAuthUrl(@CurrentUser() user: CurrentUserData) {
    const authUrl = this.tiktokAdsService.getAuthorizationUrl(user.userId);
    return { authUrl };
  }

  @Get('callback')
  @AllowWithoutAdAccount()
  @ApiOperation({ summary: 'Handle OAuth callback from TikTok' })
  async handleCallback(
    @Query('auth_code') authCode: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    if (!authCode || !userId) {
      return res.redirect(
        `${frontendUrl}/connect-ad-accounts?tiktok_error=${encodeURIComponent('Invalid callback parameters')}`,
      );
    }

    try {
      const { accessToken, advertiserId } = await this.tiktokAdsService.handleOAuthCallback(authCode);

      if (advertiserId) {
        await this.tiktokAdsService.connectAdAccount(userId, advertiserId, accessToken);
        return res.redirect(
          `${frontendUrl}/connect-ad-accounts?tiktok_success=true&message=${encodeURIComponent('TikTok Ads account connected successfully')}`,
        );
      }

      return res.redirect(
        `${frontendUrl}/connect-ad-accounts?tiktok_error=${encodeURIComponent('No advertiser account found')}`,
      );
    } catch (error) {
      return res.redirect(
        `${frontendUrl}/connect-ad-accounts?tiktok_error=${encodeURIComponent('Failed to connect TikTok Ads account')}`,
      );
    }
  }

  @Post('manual-connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @AllowWithoutAdAccount()
  @ApiOperation({ summary: 'Manually connect using access token' })
  async manualConnect(
    @CurrentUser() user: CurrentUserData,
    @Body('accessToken') accessToken: string,
    @Body('advertiserId') advertiserId: string,
  ) {
    if (!accessToken || !advertiserId) {
      throw new BadRequestException('Access token and advertiser ID are required');
    }

    try {
      const adAccount = await this.tiktokAdsService.connectAdAccount(
        user.userId,
        advertiserId,
        accessToken,
      );

      return {
        message: 'TikTok Ads account connected successfully',
        adAccount: {
          id: adAccount.id,
          accountName: adAccount.accountName,
          platformAccountId: adAccount.platformAccountId,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to connect TikTok account');
    }
  }
}

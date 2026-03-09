import { Controller, Get, Delete, Param, UseGuards, Put, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdAccountsService } from './ad-accounts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { AllowWithoutAdAccount } from '../common/decorators/allow-without-ad-account.decorator';
import { AdPlatform } from '@prisma/client';

@ApiTags('Ad Accounts')
@Controller('ad-accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdAccountsController {
  constructor(private adAccountsService: AdAccountsService) {}

  @Get()
  @AllowWithoutAdAccount()
  @ApiOperation({ summary: 'Get all ad accounts for current user' })
  async getAdAccounts(@CurrentUser() user: CurrentUserData) {
    const accounts = await this.adAccountsService.getUserAdAccounts(user.userId);
    return {
      success: true,
      count: accounts.length,
      data: accounts,
    };
  }

  @Get('can-add/:platform')
  @AllowWithoutAdAccount()
  @ApiOperation({ summary: 'Check if user can add account for platform' })
  async canAddAccount(
    @CurrentUser() user: CurrentUserData,
    @Param('platform') platform: AdPlatform,
  ) {
    const canAdd = await this.adAccountsService.canAddAccount(user.userId, platform);
    return {
      success: true,
      canAdd,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific ad account details' })
  async getAdAccount(
    @CurrentUser() user: CurrentUserData,
    @Param('id') adAccountId: string,
  ) {
    const account = await this.adAccountsService.getAdAccountById(
      user.userId,
      adAccountId,
    );
    return {
      success: true,
      data: account,
    };
  }

  @Put(':id/name')
  @ApiOperation({ summary: 'Update ad account name' })
  async updateAccountName(
    @CurrentUser() user: CurrentUserData,
    @Param('id') adAccountId: string,
    @Body('name') name: string,
  ) {
    const account = await this.adAccountsService.updateAccountName(
      user.userId,
      adAccountId,
      name,
    );
    return {
      success: true,
      data: account,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete/disconnect ad account' })
  async deleteAdAccount(
    @CurrentUser() user: CurrentUserData,
    @Param('id') adAccountId: string,
  ) {
    await this.adAccountsService.deleteAdAccount(user.userId, adAccountId);
    return {
      success: true,
      message: 'Ad account disconnected successfully',
    };
  }
}

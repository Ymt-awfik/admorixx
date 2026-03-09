import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get()
  async getCampaigns(@CurrentUser() user: CurrentUserData) {
    const campaigns = await this.campaignsService.getUserCampaigns(user.userId);
    return { success: true, data: campaigns };
  }

  @Get(':id')
  async getCampaign(
    @CurrentUser() user: CurrentUserData,
    @Param('id') campaignId: string,
  ) {
    const campaign = await this.campaignsService.getCampaignById(
      user.userId,
      campaignId,
    );
    return { success: true, data: campaign };
  }
}
